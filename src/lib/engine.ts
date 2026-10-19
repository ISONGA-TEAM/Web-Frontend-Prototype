// Pure state transitions for the workspace. Each action takes the store and the acting user, enforces
// the SRS rules, appends to the audit log (denied attempts too, NFR-26) and returns a new store.
import { sha256 } from './sha256';
import type { Action } from './rules';
import {
    addMonths, appendLedger, approvalDenial, can, chainFor, daysBetween, DAY, exitedStatuses, hasEverReceived, holdsAny, inScope, passOnTasks, pendingSlot,
    validateTransfer, canTransition, productListHas, lockedActions, roleTemplate,
} from './rules';
import type { RuleError, TransferInput } from './rules';
import { ancestorAt, isWithin, nodeMap, storeOf } from '../data/hierarchy';
import { girinkaCriteria } from '../data/criteria';
import type {
    Animal, AnimalStatus, Assessment, Config, ExitEvent, Grievance, HealthEvent, Household, HolderRef, Role, SelectionList, Store, Target, Transfer, TransferState, User,
} from '../types';

export interface Result { s: Store; ok: boolean; errors: RuleError[]; id?: string; warnings?: string[] }
const clone = <T,>(v: T): T => structuredClone(v);
const now = () => new Date().toISOString();
const nextId = (d: Store, prefix: string) => `${prefix}-${String(++d.seq).padStart(4, '0')}`;
function audit(d: Store, user: User, action: string, recordId: string, result: 'ok' | 'denied', detail = '') {
    d.audit.push({ id: nextId(d, 'AU'), ts: now(), userId: user.id, role: user.role, nodeId: user.nodeId, action, recordId, result, detail });
}
const deny = (s: Store, user: User, action: string, recordId: string, errors: RuleError[]): Result => {
    const d = clone(s); audit(d, user, action, recordId, 'denied', errors.map(e => `${e.rule}: ${e.message}`).join('; '));
    return { s: d, ok: false, errors };
};
const one = (rule: string, field: string, message: string): RuleError[] => [{ rule, field, message }];
const denyPerm = (s: Store, user: User, action: string, id: string) => deny(s, user, action, id, one('permission', 'role', 'Your role is not allowed to do this.'));
const denyScope = (s: Store, user: User, action: string, id: string) => deny(s, user, action, id, one('jurisdiction', 'node', 'That record is outside your jurisdiction.'));
const done = (d: Store, id?: string, warnings?: string[]): Result => ({ s: d, ok: true, errors: [], id, warnings });

// ---------- Households (REQ-07..09) ----------
export interface HouseholdInput { headName: string; nid: string; sex: 'F' | 'M'; dob: string; size: number; villageId: string; phone: string; shelter: string; vulnerability: string[] }
export function registerHousehold(s: Store, user: User, input: HouseholdInput): Result {
    if (!can(user, 'nominate_household', s.grants)) return denyPerm(s, user, 'household.register', '-');
    const errors: RuleError[] = [];
    if (!/^\d{16}$/.test(input.nid)) errors.push({ rule: 'nid_format', field: 'nid', message: 'The national ID reference must be 16 digits.' });
    if (!input.headName.trim()) errors.push({ rule: 'required', field: 'headName', message: 'Enter the household head’s name.' });
    if (!input.dob) errors.push({ rule: 'required', field: 'dob', message: 'Enter the date of birth.' });
    if (!(input.size >= 1)) errors.push({ rule: 'required', field: 'size', message: 'Household size must be at least 1.' });
    if (!input.phone.trim()) errors.push({ rule: 'required', field: 'phone', message: 'Enter a contact phone number.' });
    if (nodeMap[input.villageId]?.level !== 'village') errors.push({ rule: 'village', field: 'villageId', message: 'Choose a village.' });
    else if (!inScope(user, input.villageId)) return denyScope(s, user, 'household.register', input.villageId);
    if (errors.length) return deny(s, user, 'household.register', '-', errors);
    const d = clone(s);
    const district = ancestorAt(input.villageId, 'district')?.id;
    const warnings = d.households.some(h => h.nid === input.nid && ancestorAt(h.villageId, 'district')?.id === district) ? ['Another household in this district has the same national ID. Review before continuing (REQ-07).'] : [];
    const h: Household = { id: nextId(d, 'HH'), ...input, verification: 'manual', status: 'Registered', registeredOn: now(), assessments: [], consentOn: now() };
    d.households.unshift(h);
    audit(d, user, 'household.register', h.id, 'ok', warnings.join(' '));
    return done(d, h.id, warnings);
}

export function assessHousehold(s: Store, user: User, householdId: string, answers: Assessment['criteria']): Result {
    if (!can(user, 'assess', s.grants)) return denyPerm(s, user, 'household.assess', householdId);
    const h = s.households.find(x => x.id === householdId);
    if (!h) return deny(s, user, 'household.assess', householdId, one('not_found', 'id', 'Household not found.'));
    if (!inScope(user, h.villageId)) return denyScope(s, user, 'household.assess', householdId);
    if (answers.length !== girinkaCriteria.length) return deny(s, user, 'household.assess', householdId, one('incomplete', 'criteria', 'Answer every criterion.'));
    const result = answers.some(a => !a.answer) ? 'Not Eligible' : answers.some(a => a.evidence === 'none') ? 'Needs Review' : 'Eligible';
    const d = clone(s);
    const dh = d.households.find(x => x.id === householdId)!;
    dh.assessments.push({ id: nextId(d, 'AS'), date: now(), assessorId: user.id, result, criteria: answers });
    dh.status = result;
    audit(d, user, 'household.assess', householdId, 'ok', result);
    return done(d, householdId);
}

// ---------- Selection lists (REQ-09) ----------
const listSteps: SelectionList['step'][] = ['Village nomination', 'Cell verification', 'Sector approval', 'District approval', 'Approved'];
const stepRole: Record<string, Role> = { 'Village nomination': 'village_agent', 'Cell verification': 'cell_officer', 'Sector approval': 'sector_officer', 'District approval': 'district_coordinator' };
export function createList(s: Store, user: User, villageId: string, householdIds: string[]): Result {
    if (user.role !== 'village_agent' && !can(user, 'nominate_household', s.grants)) return denyPerm(s, user, 'list.create', villageId);
    if (!inScope(user, villageId)) return denyScope(s, user, 'list.create', villageId);
    const bad = householdIds.map(id => s.households.find(h => h.id === id)).filter(h => !h || h.status !== 'Eligible' || h.villageId !== villageId || holdsAny(s, h.id) || hasEverReceived(s, h.id));
    if (!householdIds.length || bad.length) return deny(s, user, 'list.create', villageId, one('eligible_only', 'householdIds', 'A list needs at least one household, and every household must be Eligible, in this village and not yet served.'));
    const d = clone(s);
    const version = d.lists.filter(l => l.nodeId === villageId && l.type === 'beneficiary').length + 1;
    const l: SelectionList = { id: nextId(d, 'LS'), nodeId: villageId, type: 'beneficiary', version, householdIds, step: 'Village nomination', log: [], locked: false };
    d.lists.push(l); audit(d, user, 'list.create', l.id, 'ok', `v${version}`);
    return done(d, l.id);
}
export function advanceList(s: Store, user: User, listId: string, comment: string, action: 'advance' | 'return'): Result {
    const l = s.lists.find(x => x.id === listId);
    if (!l) return deny(s, user, 'list.step', listId, one('not_found', 'id', 'List not found.'));
    if (l.locked) return deny(s, user, 'list.step', listId, one('locked', 'id', 'An approved list is locked. Create a new version instead.'));
    if (user.role !== stepRole[l.step] && !(l.step === 'Village nomination' && can(user, 'nominate_household', s.grants))) return denyPerm(s, user, 'list.step', listId);
    if (!inScope(user, l.nodeId)) return denyScope(s, user, 'list.step', listId);
    if (action === 'return' && !comment.trim()) return deny(s, user, 'list.step', listId, one('reason', 'comment', 'A reason is required to return a list.'));
    const idx = listSteps.indexOf(l.step);
    if (action === 'return' && idx === 0) return deny(s, user, 'list.step', listId, one('first_step', 'id', 'The list is already at the first step.'));
    if (action === 'advance' && s.households.some(h => l.householdIds.includes(h.id) && h.status !== 'Eligible')) return deny(s, user, 'list.step', listId, one('eligible_only', 'householdIds', 'A list cannot move forward unless every household on it is Eligible.'));
    const d = clone(s);
    const dl = d.lists.find(x => x.id === listId)!;
    dl.log.push({ ts: now(), by: user.id, step: l.step, action, comment });
    dl.step = listSteps[action === 'advance' ? idx + 1 : idx - 1];
    if (dl.step === 'Approved') dl.locked = true;
    audit(d, user, `list.${action}`, listId, 'ok', dl.step);
    return done(d, listId);
}

// ---------- Animals (REQ-11) ----------
export interface AnimalInput { tag: string; breed: string; sex: 'Female' | 'Male'; dob: string; dobEstimated: boolean; colour: string; source: string }
export function registerAnimal(s: Store, user: User, input: AnimalInput): Result {
    if (!can(user, 'register_animal', s.grants)) return denyPerm(s, user, 'animal.register', '-');
    const tag = input.tag.trim().toUpperCase();
    const errors: RuleError[] = [];
    if (!tag) errors.push({ rule: 'required', field: 'tag', message: 'Enter the tag number.' });
    if (s.animals.some(a => a.tag === tag)) errors.push({ rule: 'tag_unique', field: 'tag', message: 'Tag numbers are unique across the programme and are never reused (REQ-11).' });
    if (!input.breed.trim()) errors.push({ rule: 'required', field: 'breed', message: 'Enter the breed.' });
    if (!input.dob) errors.push({ rule: 'required', field: 'dob', message: 'Enter the date of birth (or an estimate).' });
    if (input.sex === 'Male') errors.push({ rule: 'no_bulls', field: 'sex', message: 'Bulls are not allocated under Girinka in v1.0 (REQ-11).' });
    if (errors.length) return deny(s, user, 'animal.register', tag, errors);
    const d = clone(s);
    const district = ancestorAt(user.nodeId, 'district')?.id ?? 'D-NYB';
    const holder: HolderRef = { kind: 'store', id: storeOf(district), nodeId: district };
    let a: Animal = { id: nextId(d, 'AN'), tag, breed: input.breed.trim(), sex: input.sex, dob: input.dob, dobEstimated: input.dobEstimated, colour: input.colour, source: input.source, status: 'In District Store', holder, statusHistory: [{ ts: now(), status: 'In District Store', ref: 'registration' }], ledger: [] };
    a = appendLedger(a, 'registration', `REG-${a.id}`, input.source || 'Supplier', holder.id, now());
    d.animals.push(a); audit(d, user, 'animal.register', a.id, 'ok', tag);
    return done(d, a.id);
}

const setStatus = (a: Animal, status: AnimalStatus, ref: string) => { a.status = status; a.statusHistory.push({ ts: now(), status, ref }); };

// ---------- Transfers (REQ-14..24) ----------
const pushHistory = (t: Transfer, user: User | string, state: TransferState, note = '') => { t.state = state; t.history.push({ ts: now(), by: typeof user === 'string' ? user : user.id, state, note }); };
export function createTransfer(s: Store, user: User, input: TransferInput, reversalOf?: string): Result {
    if (!can(user, 'create_transfer', s.grants)) return denyPerm(s, user, 'transfer.create', input.animalId);
    if (!inScope(user, input.from.nodeId) && !inScope(user, input.to.nodeId)) return denyScope(s, user, 'transfer.create', input.animalId);
    const errors = validateTransfer(s, input);
    if (errors.length) return deny(s, user, 'transfer.create', input.animalId, errors);
    const d = clone(s);
    const orig = reversalOf ? d.transfers.find(t => t.id === reversalOf) : undefined;
    const t: Transfer = { id: nextId(d, 'TR'), ...input, state: 'Draft', createdBy: user.id, createdAt: now(), approvals: [], history: [], chain: orig ? [...orig.chain] : chainFor(input.type, input.from, input.to), reversalOf };
    pushHistory(t, user, 'Draft', 'Created');
    d.transfers.push(t); audit(d, user, 'transfer.create', t.id, 'ok', input.type);
    return done(d, t.id);
}
const findT = (s: Store, id: string) => s.transfers.find(t => t.id === id);
const missing = (s: Store, user: User, action: string, id: string) => deny(s, user, action, id, one('not_found', 'id', 'Transfer not found.'));
const wrongState = (s: Store, user: User, action: string, t: Transfer, to: TransferState) => deny(s, user, action, t.id, one('state', 'state', `A transfer in "${t.state}" cannot move to "${to}".`));
const touches = (user: User, t: Transfer) => inScope(user, t.from.nodeId) || inScope(user, t.to.nodeId) || (user.role === 'household' && t.to.id === user.householdId);

export function submitTransfer(s: Store, user: User, id: string): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.submit', id);
    if (!touches(user, t) || !can(user, 'create_transfer', s.grants)) return denyScope(s, user, 'transfer.submit', id);
    const via: TransferState = t.state === 'Returned' ? 'Draft' : t.state;
    if (via !== 'Draft') return wrongState(s, user, 'transfer.submit', t, 'Submitted');
    const errors = validateTransfer(s, { type: t.type, animalId: t.animalId, from: t.from, to: t.to, plannedDate: t.plannedDate, reason: t.reason }, Date.now(), t.id);
    if (errors.length) return deny(s, user, 'transfer.submit', id, errors);
    const d = clone(s); const dt = findT(d, id)!;
    if (t.state === 'Returned') pushHistory(dt, user, 'Draft', 'Resubmitted after return');
    dt.approvals = [];
    pushHistory(dt, user, 'Submitted'); audit(d, user, 'transfer.submit', id, 'ok');
    return done(d, id);
}
export function decideTransfer(s: Store, user: User, id: string, decision: 'approve' | 'return' | 'reject', comment: string): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.approve', id);
    const denial = approvalDenial(user, t, s.grants);
    if (denial) return deny(s, user, 'transfer.approve', id, one('approval', 'role', denial));
    if (decision !== 'approve' && !comment.trim()) return deny(s, user, 'transfer.approve', id, one('reason', 'comment', 'A reason is required to return or reject (REQ-15).'));
    const d = clone(s); const dt = findT(d, id)!;
    const level = dt.approvals.filter(a => a.decision === 'approve').length;
    dt.approvals.push({ level, role: pendingSlot(t)!, approverId: user.id, decision, comment, ts: now() });
    const target: TransferState = decision === 'return' ? 'Returned' : decision === 'reject' ? 'Rejected' : level + 1 >= dt.chain.length ? 'Approved' : 'Pending Next Approval';
    if (!canTransition(dt.state, target)) return wrongState(s, user, 'transfer.approve', t, target);
    pushHistory(dt, user, target, comment); audit(d, user, `transfer.${decision}`, id, 'ok', `level ${level + 1}`);
    return done(d, id);
}
export interface DispatchInput { sender: string; senderNid: string; transport: string; photos: string[]; gps: string }
export function dispatchTransfer(s: Store, user: User, id: string, input: DispatchInput): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.dispatch', id);
    if (!can(user, 'confirm_receipt', s.grants) || user.role === 'household' || !inScope(user, t.from.nodeId)) return denyScope(s, user, 'transfer.dispatch', id);
    if (t.state !== 'Approved') return wrongState(s, user, 'transfer.dispatch', t, 'Dispatched');
    const errors: RuleError[] = [];
    if (!input.sender.trim()) errors.push({ rule: 'sender', field: 'sender', message: 'Enter the sender’s name (sender confirmation, REQ-16).' });
    if (!/^\d{16}$/.test(input.senderNid)) errors.push({ rule: 'sender', field: 'senderNid', message: 'The sender’s national ID reference must be 16 digits.' });
    if (input.photos.length > 3) errors.push({ rule: 'photos', field: 'photos', message: 'Up to three photos can be attached.' });
    if (errors.length) return deny(s, user, 'transfer.dispatch', id, errors);
    const d = clone(s); const dt = findT(d, id)!; const a = d.animals.find(x => x.id === dt.animalId)!;
    dt.dispatch = { ts: now(), ...input };
    dt.prevStatus = a.status;
    setStatus(a, 'Allocated (In Transit)', dt.id);
    pushHistory(dt, user, 'Dispatched'); audit(d, user, 'transfer.dispatch', id, 'ok');
    return done(d, id);
}
export interface ReceiptInput { tagRead: string; sex: string; condition: 'good' | 'fair' | 'poor'; remarks: string }
export function receiveTransfer(s: Store, user: User, id: string, input: ReceiptInput): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.receipt', id);
    const own = user.role === 'household' && user.householdId === t.to.id;
    if (!own && !(can(user, 'confirm_receipt', s.grants) && inScope(user, t.to.nodeId))) return denyScope(s, user, 'transfer.receipt', id);
    if (t.state !== 'Dispatched') return wrongState(s, user, 'transfer.receipt', t, 'Received');
    if (!input.tagRead.trim()) return deny(s, user, 'transfer.receipt', id, one('required', 'tagRead', 'Enter the tag number you read on the animal.'));
    const a = s.animals.find(x => x.id === t.animalId)!;
    const mismatch = input.tagRead.trim().toUpperCase() !== a.tag || input.sex.toLowerCase() !== a.sex.toLowerCase();
    const d = clone(s); const dt = findT(d, id)!;
    dt.receipt = { ts: now(), by: user.id, tagRead: input.tagRead.trim().toUpperCase(), sex: input.sex, condition: input.condition, remarks: input.remarks };
    pushHistory(dt, user, mismatch ? 'Disputed' : 'Received', mismatch ? 'Tag or sex does not match the transfer record' : '');
    audit(d, user, mismatch ? 'transfer.dispute' : 'transfer.receipt', id, 'ok');
    return done(d, id);
}
export function resolveDispute(s: Store, user: User, id: string, resolution: 'accept' | 'cancel', note: string): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.resolve', id);
    if (user.role !== 'district_coordinator' || !touches(user, t)) return denyPerm(s, user, 'transfer.resolve', id);
    if (t.state !== 'Disputed') return wrongState(s, user, 'transfer.resolve', t, resolution === 'accept' ? 'Received' : 'Cancelled');
    if (!note.trim()) return deny(s, user, 'transfer.resolve', id, one('reason', 'note', 'Record how the dispute was resolved.'));
    const d = clone(s); const dt = findT(d, id)!;
    if (resolution === 'cancel') { const a = d.animals.find(x => x.id === dt.animalId)!; setStatus(a, dt.prevStatus ?? 'With Holder', dt.id); }
    pushHistory(dt, user, resolution === 'accept' ? 'Received' : 'Cancelled', note); audit(d, user, 'transfer.resolve', id, 'ok', resolution);
    return done(d, id);
}
export const otpFor = (t: Pick<Transfer, 'id' | 'animalId'>) => String(parseInt(sha256(`otp:${t.id}:${t.animalId}`).slice(0, 8), 16) % 1_000_000).padStart(6, '0');
const needsAck = (t: Transfer) => t.type === 'primary' || t.type === 'pass_on';
function finish(d: Store, dt: Transfer, user: User) {
    const a = d.animals.find(x => x.id === dt.animalId)!;
    a.holder = dt.to;
    const keep: AnimalStatus[] = ['Pregnant', 'Lactating'];
    setStatus(a, dt.to.kind === 'store' ? 'In District Store' : dt.prevStatus && keep.includes(dt.prevStatus) ? dt.prevStatus : 'With Holder', dt.id);
    const upd = appendLedger(a, dt.type === 'reversal' ? 'reversal' : 'transfer', dt.id, dt.from.id, dt.to.id, now());
    a.ledger = upd.ledger;
    dt.completedAt = now();
    pushHistory(dt, user, 'Completed');
}
export function acknowledgeTransfer(s: Store, user: User, id: string, method: 'otp' | 'paper', code: string, device: string): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.ack', id);
    if (t.state !== 'Received') return wrongState(s, user, 'transfer.ack', t, 'Completed');
    const own = user.role === 'household' && user.householdId === t.to.id;
    if (method === 'paper' ? !(user.role === 'cell_officer' && inScope(user, t.to.nodeId)) : !(own || (can(user, 'confirm_receipt', s.grants) && inScope(user, t.to.nodeId))))
        return method === 'paper' ? deny(s, user, 'transfer.ack', id, one('witness', 'role', 'Only the Cell Officer of the receiving cell can record a paper acknowledgment (REQ-18).')) : denyScope(s, user, 'transfer.ack', id);
    if (method === 'otp' && code.trim() !== otpFor(t)) return deny(s, user, 'transfer.ack', id, one('otp', 'code', 'The one-time code is not correct.'));
    if (method === 'paper' && !code.trim()) return deny(s, user, 'transfer.ack', id, one('attachment', 'code', 'Attach the scanned paper acknowledgment (file name).'));
    const d = clone(s); const dt = findT(d, id)!;
    dt.ack = { ts: now(), method, device };
    finish(d, dt, user); audit(d, user, 'transfer.complete', id, 'ok', `ack:${method}`);
    return done(d, id);
}
export function completeTransfer(s: Store, user: User, id: string): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.complete', id);
    if (!touches(user, t) || !can(user, 'confirm_receipt', s.grants)) return denyScope(s, user, 'transfer.complete', id);
    if (t.state !== 'Received') return wrongState(s, user, 'transfer.complete', t, 'Completed');
    if (needsAck(t) && !t.ack) return deny(s, user, 'transfer.complete', id, one('ack', 'ack', 'A digital acknowledgment from the receiving household head is required (REQ-18).'));
    const d = clone(s); finish(d, findT(d, id)!, user); audit(d, user, 'transfer.complete', id, 'ok');
    return done(d, id);
}
export function cancelTransfer(s: Store, user: User, id: string, reason: string): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.cancel', id);
    if (!touches(user, t) || !(user.id === t.createdBy || user.role === 'district_coordinator')) return denyScope(s, user, 'transfer.cancel', id);
    if (!canTransition(t.state, 'Cancelled')) return wrongState(s, user, 'transfer.cancel', t, 'Cancelled');
    if (!reason.trim()) return deny(s, user, 'transfer.cancel', id, one('reason', 'reason', 'Enter a reason.'));
    const d = clone(s); const dt = findT(d, id)!;
    if (dt.state === 'Disputed') setStatus(d.animals.find(x => x.id === dt.animalId)!, dt.prevStatus ?? 'With Holder', dt.id);
    pushHistory(dt, user, 'Cancelled', reason); audit(d, user, 'transfer.cancel', id, 'ok');
    return done(d, id);
}
export function reverseTransfer(s: Store, user: User, id: string, reason: string): Result {
    const t = findT(s, id); if (!t) return missing(s, user, 'transfer.reverse', id);
    if (!can(user, 'close_reverse', s.grants) || !touches(user, t) || !['district_coordinator', 'provincial_officer', 'national_officer'].includes(user.role)) return denyPerm(s, user, 'transfer.reverse', id);
    if (t.state !== 'Completed' || t.type === 'reversal') return deny(s, user, 'transfer.reverse', id, one('state', 'state', 'Only a completed, non-reversal transfer can be reversed.'));
    if (user.role === 'district_coordinator' && daysBetween(t.completedAt!, Date.now()) > 30) return deny(s, user, 'transfer.reverse', id, one('window', 'id', 'After 30 days a reversal needs the Provincial Officer (REQ-23).'));
    if (!reason.trim()) return deny(s, user, 'transfer.reverse', id, one('reason', 'reason', 'A reason is required.'));
    return createTransfer(s, user, { type: 'reversal', animalId: t.animalId, from: t.to, to: t.from, plannedDate: now().slice(0, 10), reason: `Reversal of ${t.id}: ${reason}` }, t.id);
}
export function closeChain(s: Store, user: User, animalId: string): Result {
    const a = s.animals.find(x => x.id === animalId);
    if (!a) return deny(s, user, 'chain.close', animalId, one('not_found', 'id', 'Animal not found.'));
    if (!can(user, 'close_reverse', s.grants) || user.role === 'village_agent') return denyPerm(s, user, 'chain.close', animalId);
    if (!['Deceased', 'Lost', 'Culled'].includes(a.status)) return deny(s, user, 'chain.close', animalId, one('state', 'status', 'A chain closes after a verified exit event (REQ-24).'));
    const open = s.transfers.some(t => t.animalId === a.id && ['Draft', 'Submitted', 'Pending Next Approval', 'Approved', 'Dispatched', 'Received', 'Disputed', 'Returned'].includes(t.state));
    if (open) return deny(s, user, 'chain.close', animalId, one('open_transfer', 'id', 'Finish or cancel the open transfer first.'));
    const d = clone(s); const da = d.animals.find(x => x.id === animalId)!;
    setStatus(da, 'Closed Chain', 'close'); da.closedOn = now();
    da.ledger = appendLedger(da, 'exit', `CLOSE-${da.id}`, da.holder.id, 'closed', now()).ledger;
    audit(d, user, 'chain.close', animalId, 'ok');
    return done(d, animalId);
}

// ---------- Exit events (REQ-22) ----------
export interface ExitInput { animalId: string; date: string; category: ExitEvent['category']; cause: string; evidence: ExitEvent['evidence'] }
function applyExit(d: Store, e: ExitEvent, user: User) {
    const a = d.animals.find(x => x.id === e.animalId)!;
    setStatus(a, e.category === 'death' ? 'Deceased' : e.category === 'loss' ? 'Lost' : 'Culled', e.id);
    a.ledger = appendLedger(a, 'exit', e.id, a.holder.id, 'exit', now()).ledger;
    a.holder = { kind: 'exit', id: 'exit', nodeId: a.holder.nodeId };
    audit(d, user, 'exit.apply', e.id, 'ok', e.category);
}
export function recordExit(s: Store, user: User, input: ExitInput): Result {
    if (!can(user, 'record_event', s.grants)) return denyPerm(s, user, 'exit.record', input.animalId);
    const a = s.animals.find(x => x.id === input.animalId);
    if (!a) return deny(s, user, 'exit.record', input.animalId, one('not_found', 'id', 'Animal not found.'));
    if (!inScope(user, a.holder.nodeId)) return denyScope(s, user, 'exit.record', input.animalId);
    const errors: RuleError[] = [];
    if (exitedStatuses.includes(a.status)) errors.push({ rule: 'already_exited', field: 'animalId', message: 'This animal already has an exit record.' });
    if (a.holder.kind !== 'household') errors.push({ rule: 'holder', field: 'animalId', message: 'Exit events are recorded for animals held by a household.' });
    if (s.transfers.some(t => t.animalId === a.id && ['Draft', 'Submitted', 'Pending Next Approval', 'Approved', 'Dispatched', 'Received', 'Disputed', 'Returned'].includes(t.state))) errors.push({ rule: 'open_transfer', field: 'animalId', message: 'Cancel or finish the open transfer first.' });
    if (input.category === 'cull' && input.evidence !== 'vet_certificate') errors.push({ rule: 'cull_evidence', field: 'evidence', message: 'Culling is allowed only with a vet certificate (REQ-22).' });
    if (!input.cause.trim()) errors.push({ rule: 'required', field: 'cause', message: 'Describe the cause.' });
    if (!input.date) errors.push({ rule: 'required', field: 'date', message: 'Enter the date.' });
    if (errors.length) return deny(s, user, 'exit.record', input.animalId, errors);
    const d = clone(s);
    const e: ExitEvent = { id: nextId(d, 'EX'), ...input, reportedBy: user.id, state: input.evidence === 'vet_certificate' ? 'Verified' : 'Pending Verification', recordedAt: now(), holderId: a.holder.id, nodeId: a.holder.nodeId };
    d.exits.push(e); audit(d, user, 'exit.record', e.id, 'ok', e.state);
    if (e.state === 'Verified') applyExit(d, e, user);
    return done(d, e.id);
}
export function verifyExit(s: Store, user: User, exitId: string, decision: 'verify' | 'reject', note: string): Result {
    const e = s.exits.find(x => x.id === exitId);
    if (!e) return deny(s, user, 'exit.verify', exitId, one('not_found', 'id', 'Exit record not found.'));
    if (!can(user, 'verify_exit', s.grants)) return denyPerm(s, user, 'exit.verify', exitId);
    if (!inScope(user, e.nodeId)) return denyScope(s, user, 'exit.verify', exitId);
    if (e.state !== 'Pending Verification') return deny(s, user, 'exit.verify', exitId, one('state', 'state', 'This record is not awaiting verification.'));
    if (!note.trim()) return deny(s, user, 'exit.verify', exitId, one('reason', 'note', 'Record what you found.'));
    const d = clone(s); const de = d.exits.find(x => x.id === exitId)!;
    de.state = decision === 'verify' ? 'Verified' : 'Rejected'; de.verifiedBy = user.id;
    audit(d, user, `exit.${decision}`, exitId, 'ok', note);
    if (decision === 'verify') applyExit(d, de, user);
    return done(d, exitId);
}

// ---------- Calving, health, visits (REQ-25, 30, 31) ----------
export interface CalvingInput { damId: string; date: string; calves: { sex: 'Female' | 'Male'; weight: number; tag: string }[]; complications: string }
export function recordCalving(s: Store, user: User, input: CalvingInput): Result {
    if (!can(user, 'record_event', s.grants)) return denyPerm(s, user, 'calving.record', input.damId);
    const dam = s.animals.find(a => a.id === input.damId);
    if (!dam) return deny(s, user, 'calving.record', input.damId, one('not_found', 'id', 'Dam not found.'));
    if (!inScope(user, dam.holder.nodeId)) return denyScope(s, user, 'calving.record', input.damId);
    const errors: RuleError[] = [];
    if (!['With Holder', 'Pregnant', 'Lactating'].includes(dam.status)) errors.push({ rule: 'dam_status', field: 'damId', message: `A dam in "${dam.status}" cannot calve. It must be With Holder, Pregnant or Lactating.` });
    if (dam.sex !== 'Female') errors.push({ rule: 'dam_sex', field: 'damId', message: 'The dam must be female.' });
    if (!input.calves.length) errors.push({ rule: 'calves', field: 'calves', message: 'Add at least one calf.' });
    if (!input.date || new Date(input.date).getTime() > Date.now() + DAY) errors.push({ rule: 'date', field: 'date', message: 'Enter a valid calving date (not in the future).' });
    for (const c of input.calves) if (c.tag.trim() && s.animals.some(a => a.tag === c.tag.trim().toUpperCase())) errors.push({ rule: 'tag_unique', field: 'calves', message: `Tag ${c.tag.toUpperCase()} is already in use.` });
    if (errors.length) return deny(s, user, 'calving.record', input.damId, errors);
    const d = clone(s); const ddam = d.animals.find(a => a.id === input.damId)!;
    const calfIds: string[] = [];
    for (const c of input.calves) {
        const id = nextId(d, 'AN');
        let calf: Animal = { id, tag: c.tag.trim() ? c.tag.trim().toUpperCase() : `UNTAGGED-${id}`, breed: ddam.breed, sex: c.sex, dob: input.date, dobEstimated: false, colour: '', source: `Born to ${ddam.tag}`, damId: ddam.id, status: 'With Holder', holder: ddam.holder, statusHistory: [{ ts: now(), status: 'With Holder', ref: 'calving' }], ledger: [] };
        calf = appendLedger(calf, 'registration', `BIRTH-${id}`, ddam.tag, ddam.holder.id, now());
        d.animals.push(calf); calfIds.push(id);
    }
    setStatus(ddam, 'Lactating', 'calving');
    d.calvings.push({ id: nextId(d, 'CV'), damId: ddam.id, date: input.date, calfIds, complications: input.complications, recordedBy: user.id });
    audit(d, user, 'calving.record', ddam.id, 'ok', input.complications ? `complications: ${input.complications}` : '');
    return done(d, calfIds[0]);
}
export interface HealthInput { animalId: string; type: HealthEvent['type']; date: string; product: string; dose: string; score?: number; remarks: string }
export function recordHealth(s: Store, user: User, input: HealthInput): Result {
    if (!can(user, 'record_event', s.grants)) return denyPerm(s, user, 'health.record', input.animalId);
    const a = s.animals.find(x => x.id === input.animalId);
    if (!a) return deny(s, user, 'health.record', input.animalId, one('not_found', 'id', 'Animal not found.'));
    if (!inScope(user, a.holder.nodeId)) return denyScope(s, user, 'health.record', input.animalId);
    const errors: RuleError[] = [];
    if (!productListHas(input.type, input.product)) errors.push({ rule: 'configured_list', field: 'product', message: 'Choose a product from the configured list. Free text is only allowed in remarks (REQ-30).' });
    if (!input.date) errors.push({ rule: 'required', field: 'date', message: 'Enter the date.' });
    if (input.type === 'body_condition' && !(input.score && input.score >= 1 && input.score <= 5)) errors.push({ rule: 'score', field: 'score', message: 'Body condition score is 1 to 5.' });
    if (errors.length) return deny(s, user, 'health.record', input.animalId, errors);
    const d = clone(s);
    d.healthEvents.push({ id: nextId(d, 'HE'), officerId: user.id, ...input, date: input.date });
    if (input.type === 'pregnancy_check') { const da = d.animals.find(x => x.id === input.animalId)!; da.pregnancyCheck = input.date; if (da.status === 'With Holder' || da.status === 'Lactating') setStatus(da, 'Pregnant', 'pregnancy_check'); }
    audit(d, user, 'health.record', input.animalId, 'ok', input.type);
    return done(d, input.animalId);
}
export interface VisitInput { householdId: string; shelter: 'good' | 'fair' | 'poor'; animal: 'good' | 'fair' | 'poor'; feedWater: 'good' | 'fair' | 'poor'; issues: string }
export function recordVisit(s: Store, user: User, input: VisitInput): Result {
    if (!['sector_officer', 'cell_officer'].includes(user.role)) return denyPerm(s, user, 'visit.record', input.householdId);
    const h = s.households.find(x => x.id === input.householdId);
    if (!h) return deny(s, user, 'visit.record', input.householdId, one('not_found', 'id', 'Household not found.'));
    if (!inScope(user, h.villageId)) return denyScope(s, user, 'visit.record', input.householdId);
    const d = clone(s);
    d.visits.push({ id: nextId(d, 'VS'), date: now(), officerId: user.id, ...input });
    audit(d, user, 'visit.record', input.householdId, 'ok');
    return done(d, input.householdId);
}

// ---------- Pass-on nomination (REQ-27) ----------
export function nominatePassOn(s: Store, user: User, calfId: string, householdId: string): Result {
    const calf = s.animals.find(a => a.id === calfId);
    const hh = s.households.find(h => h.id === householdId);
    if (!calf || !hh) return deny(s, user, 'passon.nominate', calfId, one('not_found', 'id', 'Calf or household not found.'));
    if (!passOnTasks(s).some(t => t.calfId === calfId)) return deny(s, user, 'passon.nominate', calfId, one('pass_on_calf', 'animalId', 'This calf has no pass-on task.'));
    const created = createTransfer(s, user, { type: 'pass_on', animalId: calfId, from: calf.holder, to: { kind: 'household', id: hh.id, nodeId: hh.villageId }, plannedDate: now().slice(0, 10), reason: 'Pass-on of the first female calf (Girinka principle)' });
    if (!created.ok) return created;
    const submitted = submitTransfer(created.s, user, created.id!);
    return submitted.ok ? submitted : created;
}

// ---------- Grievances (REQ-49) ----------
const routeFor: Record<Grievance['category'], Role> = { eligibility: 'sector_officer', transfer: 'district_coordinator', receipt: 'sector_officer', animal_care: 'cell_officer' };
export function raiseGrievance(s: Store, user: User, category: Grievance['category'], text: string): Result {
    if (!can(user, 'raise_grievance', s.grants) || !user.householdId) return denyPerm(s, user, 'grievance.raise', '-');
    if (!text.trim()) return deny(s, user, 'grievance.raise', '-', one('required', 'text', 'Describe the problem.'));
    const d = clone(s);
    const g: Grievance = { id: nextId(d, 'GR'), householdId: user.householdId, category, text, raisedOn: now(), routedToRole: routeFor[category], status: 'Open', nodeId: user.nodeId };
    d.grievances.push(g); audit(d, user, 'grievance.raise', g.id, 'ok', category);
    return done(d, g.id);
}
export function updateGrievance(s: Store, user: User, id: string, status: 'Acknowledged' | 'Closed', outcome: string): Result {
    const g = s.grievances.find(x => x.id === id);
    if (!g) return deny(s, user, 'grievance.update', id, one('not_found', 'id', 'Grievance not found.'));
    if (!can(user, 'handle_grievance', s.grants) || !(inScope(user, g.nodeId) || daysBetween(g.raisedOn, Date.now()) > 30 && user.role === 'provincial_officer')) return denyScope(s, user, 'grievance.update', id);
    if (status === 'Closed' && !outcome.trim()) return deny(s, user, 'grievance.update', id, one('outcome', 'outcome', 'A grievance is closed with a written outcome.'));
    const d = clone(s); const dg = d.grievances.find(x => x.id === id)!;
    dg.status = status; if (status === 'Closed') { dg.outcome = outcome; dg.closedOn = now(); }
    audit(d, user, 'grievance.update', id, 'ok', status);
    return done(d, id);
}

// ---------- Alerts, configuration, targets, exports ----------
export function setAlertState(s: Store, user: User, alertId: string, status: 'Acknowledged' | 'Resolved', note: string): Result {
    if (user.role === 'household' || user.role === 'auditor') return denyPerm(s, user, 'alert.update', alertId);
    if (status === 'Resolved' && !note.trim()) return deny(s, user, 'alert.update', alertId, one('note', 'note', 'Resolving an alert needs a note (REQ-38).'));
    const d = clone(s); d.alertStates[alertId] = { status, note, by: user.id, ts: now() };
    audit(d, user, 'alert.update', alertId, 'ok', status);
    return done(d, alertId);
}
export function setConfig(s: Store, user: User, patch: Partial<Config>): Result {
    if (!can(user, 'configure', s.grants)) return denyPerm(s, user, 'config.update', '-');
    const bad = Object.entries(patch).filter(([, v]) => typeof v !== 'number' || !(v > 0));
    if (bad.length) return deny(s, user, 'config.update', '-', bad.map(([k]) => ({ rule: 'positive', field: k, message: 'Enter a number above zero.' })));
    const d = clone(s); d.config = { ...d.config, ...patch };
    audit(d, user, 'config.update', '-', 'ok', JSON.stringify(patch));
    return done(d);
}
export function setTarget(s: Store, user: User, nodeId: string, animals: number, households: number, reason: string): Result {
    if (!can(user, 'manage_targets', s.grants)) return denyPerm(s, user, 'target.update', nodeId);
    const node = nodeMap[nodeId];
    if (!node || !isWithin(nodeId, user.nodeId) || (user.role === 'district_coordinator' && node.level !== 'sector')) return denyScope(s, user, 'target.update', nodeId);
    const year = new Date().getFullYear();
    const parent = node.parentId ? s.targets.filter(t => t.nodeId === node.parentId && t.year === year).sort((a, b) => b.version - a.version)[0] : undefined;
    const siblings = s.targets.filter(t => t.year === year && nodeMap[t.nodeId]?.parentId === node.parentId && t.nodeId !== nodeId).reduce((m, t) => { const cur = m.get(t.nodeId); if (!cur || cur.version < t.version) m.set(t.nodeId, t); return m; }, new Map<string, Target>());
    const siblingTotal = [...siblings.values()].reduce((n, t) => n + t.animals, 0);
    if (parent && siblingTotal + animals > parent.animals) return deny(s, user, 'target.update', nodeId, one('quota', 'animals', `This would exceed the ${nodeMap[parent.nodeId].name} quota of ${parent.animals} (REQ-03).`));
    const prev = s.targets.filter(t => t.nodeId === nodeId && t.year === year).sort((a, b) => b.version - a.version)[0];
    if (prev && !reason.trim()) return deny(s, user, 'target.update', nodeId, one('reason', 'reason', 'Changing an approved quota needs a reason (REQ-03).'));
    const d = clone(s); d.targets.push({ nodeId, year, animals, households, version: (prev?.version ?? 0) + 1 });
    audit(d, user, 'target.update', nodeId, 'ok', `${animals} animals / ${households} households. ${reason}`);
    return done(d);
}
export function logExport(s: Store, user: User, what: string, rows: number, filters: string): Result {
    if (!can(user, 'export', s.grants)) return denyPerm(s, user, 'export', what);
    const d = clone(s); audit(d, user, 'export', what, 'ok', `${rows} rows; ${filters}`);
    return done(d);
}
/** Data-subject requests (REQ-50): a household downloads its own record; the request is logged. */
export function logDataRequest(s: Store, user: User, kind: 'export' | 'correction', recordId: string, detail = ''): Result {
    const d = clone(s); audit(d, user, `data_subject.${kind}`, recordId, 'ok', detail);
    return done(d, recordId);
}
/** The assistant's prompts and outputs are logged, with personal identifiers already removed (REQ-44). */
export function logAssistant(s: Store, user: User, action: 'question' | 'draft' | 'approve', recordId: string, detail: string): Result {
    if (user.role === 'household' || user.role === 'system_admin') return denyPerm(s, user, `ai.${action}`, recordId);
    const d = clone(s); audit(d, user, `ai.${action}`, recordId, 'ok', detail.slice(0, 600));
    return done(d, recordId);
}
// ---------- Permission management (System Administrator) ----------
/** Grant, revoke or reset one permission for one user. Reversible at any time; every change is audited with a reason. */
export function setPermission(s: Store, user: User, targetId: string, action: Action, change: 'grant' | 'revoke' | 'reset', reason: string): Result {
    if (!can(user, 'manage_permissions', s.grants)) return denyPerm(s, user, `permission.${change}`, targetId);
    const target = s.users.find(u => u.id === targetId);
    if (!target) return deny(s, user, `permission.${change}`, targetId, one('not_found', 'user', 'User not found.'));
    if (target.id === user.id) return deny(s, user, `permission.${change}`, targetId, one('self', 'user', 'You cannot change your own permissions.'));
    if (lockedActions.includes(action)) return deny(s, user, `permission.${change}`, targetId, one('locked', 'permission', 'This permission is fixed by the SRS and cannot be granted or revoked.'));
    if (!reason.trim()) return deny(s, user, `permission.${change}`, targetId, one('reason', 'reason', 'Record why you are changing this permission.'));
    const d = clone(s);
    const g = d.grants[targetId] ?? { granted: [], revoked: [] };
    g.granted = g.granted.filter(a => a !== action); g.revoked = g.revoked.filter(a => a !== action);
    const base = (roleTemplate(target.role) as string[]).includes(action);
    if (change === 'grant' && !base) g.granted.push(action);
    if (change === 'revoke' && base) g.revoked.push(action);
    if (g.granted.length || g.revoked.length) d.grants[targetId] = g; else delete d.grants[targetId];
    audit(d, user, `permission.${change}`, targetId, 'ok', `${action}: ${reason}`);
    return done(d, targetId);
}
export function resetPermissions(s: Store, user: User, targetId: string, reason: string): Result {
    if (!can(user, 'manage_permissions', s.grants)) return denyPerm(s, user, 'permission.reset', targetId);
    if (targetId === user.id) return deny(s, user, 'permission.reset', targetId, one('self', 'user', 'You cannot change your own permissions.'));
    if (!reason.trim()) return deny(s, user, 'permission.reset', targetId, one('reason', 'reason', 'Record why you are resetting this user.'));
    const d = clone(s); delete d.grants[targetId];
    audit(d, user, 'permission.reset', targetId, 'ok', reason);
    return done(d, targetId);
}
// ---------- Saved dashboard views (REQ-37) ----------
export function saveView(s: Store, user: User, name: string, query: string, layer: string, shared: boolean): Result {
    if (!can(user, 'page_dashboard', s.grants) || user.role === 'household') return denyPerm(s, user, 'view.save', '-');
    if (!name.trim()) return deny(s, user, 'view.save', '-', one('required', 'name', 'Give the view a name.'));
    if (s.savedViews.some(v => v.ownerId === user.id && v.name.toLowerCase() === name.trim().toLowerCase())) return deny(s, user, 'view.save', '-', one('duplicate', 'name', 'You already have a view with that name.'));
    const d = clone(s);
    const v = { id: nextId(d, 'SV'), ownerId: user.id, ownerNodeId: user.nodeId, name: name.trim(), query, layer, shared, createdAt: now() };
    d.savedViews.push(v); audit(d, user, 'view.save', v.id, 'ok', `${v.name}${shared ? ' (shared downwards)' : ''}`);
    return done(d, v.id);
}
export function deleteView(s: Store, user: User, id: string): Result {
    const v = s.savedViews.find(x => x.id === id);
    if (!v || v.ownerId !== user.id) return deny(s, user, 'view.delete', id, one('not_found', 'id', 'You can only delete your own views.'));
    const d = clone(s); d.savedViews = d.savedViews.filter(x => x.id !== id); audit(d, user, 'view.delete', id, 'ok', v.name);
    return done(d, id);
}
export const monthsAgo = (n: number) => addMonths(now(), -n);
