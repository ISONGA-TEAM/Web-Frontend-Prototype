// Business rules from the SRS: permissions (2.4.1), approval chains (3.5.1), the transfer state
// machine (3.5.2), request validation (REQ-14), the chain ledger (REQ-20) and derived data
// (pass-on tasks, alerts, health index, Imihigo progress).
import { sha256 } from './sha256';
import { isWithin, nodeMap, ancestorAt } from '../data/hierarchy';
import { productList } from '../data/criteria';
import type { Animal, AlertState, HolderRef, LedgerEntry, Role, Store, Transfer, TransferState, TransferType, User } from '../types';

export const DAY = 86_400_000;
export const daysBetween = (a: string | number, b: string | number) => Math.floor((new Date(b).getTime() - new Date(a).getTime()) / DAY);
export const addMonths = (iso: string, months: number) => { const d = new Date(iso); d.setMonth(d.getMonth() + months); return d.toISOString(); };

// ---------- Permissions ----------
// Effective permissions = role template, plus grants and minus revocations set by the System Administrator
// (the highest role). Grants never widen jurisdiction (inScope still applies) and never change the approval
// chain, which stays tied to the role in each slot (3.5.1).
export type PageAction =
    | 'page_dashboard' | 'page_households' | 'page_selection' | 'page_animals' | 'page_transfers' | 'page_approvals' | 'page_passon'
    | 'page_alerts' | 'page_reports' | 'page_grievances' | 'page_assistant' | 'page_admin' | 'page_audit';
export type WidgetAction =
    | 'widget_kpis' | 'widget_map' | 'widget_children' | 'widget_imihigo' | 'widget_pipeline' | 'widget_trend' | 'widget_stages' | 'widget_health' | 'widget_approvals' | 'widget_alerts'
    | 'widget_worklist' | 'widget_calving_calendar' | 'widget_to_visit'
    | 'widget_my_status' | 'widget_my_actions' | 'widget_my_animals' | 'widget_my_transfers';
export type Action =
    | PageAction | WidgetAction
    | 'nominate_household' | 'assess' | 'approve_list' | 'create_transfer' | 'approve_transfer' | 'confirm_receipt' | 'record_event' | 'close_reverse'
    | 'export' | 'manage_hierarchy' | 'view_audit' | 'register_animal' | 'verify_exit' | 'configure' | 'raise_grievance' | 'handle_grievance' | 'manage_targets' | 'manage_permissions';

export interface PermissionGrant { granted: Action[]; revoked: Action[] }
export type Grants = Record<string, PermissionGrant>;

const pageTemplate: Record<Role, Action[]> = {
    system_admin: ['page_dashboard', 'page_alerts', 'page_admin', 'page_audit', 'manage_hierarchy', 'configure', 'view_audit', 'manage_permissions'],
    national_officer: ['page_dashboard', 'page_households', 'page_animals', 'page_transfers', 'page_approvals', 'page_passon', 'page_alerts', 'page_reports', 'page_grievances', 'page_assistant', 'page_admin', 'approve_transfer', 'configure', 'manage_targets', 'export', 'close_reverse', 'handle_grievance'],
    provincial_officer: ['page_dashboard', 'page_households', 'page_animals', 'page_transfers', 'page_approvals', 'page_passon', 'page_alerts', 'page_reports', 'page_grievances', 'page_assistant', 'approve_transfer', 'export', 'close_reverse', 'handle_grievance'],
    district_coordinator: ['page_dashboard', 'page_households', 'page_selection', 'page_animals', 'page_transfers', 'page_approvals', 'page_passon', 'page_alerts', 'page_reports', 'page_grievances', 'page_assistant', 'nominate_household', 'approve_list', 'create_transfer', 'approve_transfer', 'confirm_receipt', 'record_event', 'register_animal', 'export', 'close_reverse', 'handle_grievance', 'manage_targets'],
    sector_officer: ['page_dashboard', 'page_households', 'page_selection', 'page_animals', 'page_transfers', 'page_approvals', 'page_passon', 'page_alerts', 'page_reports', 'page_grievances', 'page_assistant', 'nominate_household', 'assess', 'approve_list', 'create_transfer', 'approve_transfer', 'confirm_receipt', 'record_event', 'verify_exit', 'export', 'handle_grievance'],
    cell_officer: ['page_dashboard', 'page_households', 'page_selection', 'page_animals', 'page_transfers', 'page_approvals', 'page_passon', 'page_alerts', 'page_reports', 'page_grievances', 'page_assistant', 'nominate_household', 'assess', 'approve_list', 'create_transfer', 'approve_transfer', 'confirm_receipt', 'record_event', 'export', 'handle_grievance'],
    village_agent: ['page_dashboard', 'page_households', 'page_selection', 'page_animals', 'page_transfers', 'page_passon', 'page_alerts', 'page_assistant', 'nominate_household', 'create_transfer', 'confirm_receipt', 'record_event'],
    household: ['page_dashboard', 'page_animals', 'page_transfers', 'page_grievances', 'confirm_receipt', 'raise_grievance'],
    auditor: ['page_dashboard', 'page_households', 'page_animals', 'page_transfers', 'page_passon', 'page_alerts', 'page_reports', 'page_assistant', 'page_audit', 'view_audit', 'export'],
};
// Dashboard widgets are permissions too, so the System Administrator decides what each person's dashboard shows.
const overview: WidgetAction[] = ['widget_kpis', 'widget_map', 'widget_children', 'widget_imihigo', 'widget_pipeline', 'widget_trend', 'widget_stages', 'widget_health', 'widget_approvals', 'widget_alerts'];
const widgetSets: Record<Role, WidgetAction[]> = {
    system_admin: ['widget_kpis', 'widget_map', 'widget_children', 'widget_alerts'],
    national_officer: overview, provincial_officer: overview, district_coordinator: overview, sector_officer: overview, cell_officer: overview,
    auditor: overview.filter(w => w !== 'widget_approvals'),
    village_agent: ['widget_worklist', 'widget_calving_calendar', 'widget_to_visit'],
    household: ['widget_my_status', 'widget_my_actions', 'widget_my_animals', 'widget_my_transfers'],
};
const template: Record<Role, Action[]> = Object.fromEntries((Object.keys(pageTemplate) as Role[]).map(r => [r, [...pageTemplate[r], ...widgetSets[r]]])) as Record<Role, Action[]>;
/** Permissions a grant can never touch: they would let someone bypass the SRS rules or lock everyone out. */
export const lockedActions: Action[] = ['manage_permissions', 'manage_hierarchy', 'page_dashboard'];
export const allActions: Action[] = [...new Set(Object.values(template).flat())].filter(a => !lockedActions.includes(a)).sort();
export const roleTemplate = (role: Role) => template[role];
export const permissionsOf = (user: User, grants: Grants = currentGrants): Action[] => {
    const g = grants[user.id];
    const base = new Set(template[user.role]);
    g?.granted.forEach(a => base.add(a));
    g?.revoked.forEach(a => { if (!lockedActions.includes(a)) base.delete(a); });
    return [...base];
};
// The browser sets this from the store so pages can call can(user, action) without threading grants everywhere.
let currentGrants: Grants = {};
export const setCurrentGrants = (g: Grants) => { currentGrants = g; };
export const can = (user: User | null, action: Action, grants: Grants = currentGrants) => !!user && permissionsOf(user, grants).includes(action);
/** Officials work inside their node and its descendants; the auditor reads all of it; a household sees only itself. */
export const inScope = (user: User, nodeId: string | undefined) => !!nodeId && isWithin(nodeId, user.nodeId);

// ---------- Approval chains (3.5.1) ----------
export const transferTypes: TransferType[] = ['primary', 'pass_on', 'replacement', 'move', 'return', 'reversal'];
export const chainFor = (type: TransferType, from?: HolderRef, to?: HolderRef): Role[] => {
    switch (type) {
        case 'primary': case 'replacement': return ['sector_officer', 'district_coordinator'];
        case 'pass_on': return ['cell_officer', 'sector_officer'];
        case 'return': return ['district_coordinator'];
        case 'move': {
            const cross = !!from && !!to && ancestorAt(from.nodeId, 'district')?.id !== ancestorAt(to.nodeId, 'district')?.id;
            return cross ? ['sector_officer', 'district_coordinator', 'provincial_officer'] : ['sector_officer', 'district_coordinator'];
        }
        case 'reversal': return ['district_coordinator'];
    }
};
export const chainOf = (t: Transfer) => t.chain;

// ---------- State machine (3.5.2) ----------
export const openStates: TransferState[] = ['Draft', 'Submitted', 'Pending Next Approval', 'Approved', 'Dispatched', 'Received', 'Returned', 'Disputed'];
export const terminalStates: TransferState[] = ['Completed', 'Cancelled', 'Rejected'];
const transitions: Record<TransferState, TransferState[]> = {
    'Draft': ['Submitted', 'Cancelled'],
    'Submitted': ['Pending Next Approval', 'Approved', 'Returned', 'Rejected', 'Cancelled'],
    'Pending Next Approval': ['Pending Next Approval', 'Approved', 'Returned', 'Rejected'],
    'Approved': ['Dispatched', 'Cancelled'],
    'Dispatched': ['Received', 'Disputed'],
    'Received': ['Completed'],
    'Completed': [],
    'Returned': ['Draft', 'Cancelled'],
    'Rejected': [],
    'Disputed': ['Received', 'Cancelled'],
    'Cancelled': [],
};
export const canTransition = (from: TransferState, to: TransferState) => transitions[from].includes(to);

/** The approval slot a transfer is waiting on, or null. */
export const pendingSlot = (t: Transfer): Role | null => {
    if (t.state !== 'Submitted' && t.state !== 'Pending Next Approval') return null;
    return chainOf(t)[t.approvals.filter(a => a.decision === 'approve' && a.level >= 0).length] ?? null;
};
/** REQ-15: right role for the slot, not the creator, jurisdiction contains the holder or the receiver. */
export function approvalDenial(user: User, t: Transfer, grants: Grants = currentGrants): string | null {
    const slot = pendingSlot(t);
    if (!slot) return 'This transfer is not waiting for approval.';
    if (!can(user, 'approve_transfer', grants)) return 'Your account does not have the approve-transfer permission.';
    if (user.id === t.createdBy) return 'An officer cannot approve a transfer they created (REQ-15).';
    const roleOk = user.role === slot || (slot === 'provincial_officer' && user.role === 'national_officer');
    if (!roleOk) return `The current approval level needs a ${slot.replaceAll('_', ' ')}.`;
    if (!inScope(user, t.from.nodeId) && !inScope(user, t.to.nodeId)) return 'The transfer is outside your jurisdiction.';
    if (t.approvals.some(a => a.approverId === user.id && a.decision === 'approve')) return 'You already approved an earlier level of this transfer.';
    return null;
}

// ---------- Chain ledger (REQ-20) ----------
const entryHash = (animalId: string, e: Omit<LedgerEntry, 'hash'>) => sha256(JSON.stringify([animalId, e.seq, e.kind, e.ref, e.from, e.to, e.ts, e.prevHash]));
export const GENESIS = '0'.repeat(64);
export function appendLedger(animal: Animal, kind: LedgerEntry['kind'], ref: string, from: string, to: string, ts: string): Animal {
    const prev = animal.ledger[animal.ledger.length - 1];
    const base = { seq: animal.ledger.length + 1, kind, ref, from, to, ts, prevHash: prev?.hash ?? GENESIS };
    return { ...animal, ledger: [...animal.ledger, { ...base, hash: entryHash(animal.id, base) }] };
}
export function verifyLedger(animal: Animal): { ok: boolean; brokenAt?: number } {
    let prev = GENESIS;
    for (const e of animal.ledger) {
        if (e.prevHash !== prev || e.hash !== entryHash(animal.id, e)) return { ok: false, brokenAt: e.seq };
        prev = e.hash;
    }
    return { ok: true };
}
export const holderLabel = (h: HolderRef, s?: Pick<Store, 'households'>) =>
    h.kind === 'household' ? (s?.households.find(x => x.id === h.id)?.headName ?? h.id) : h.kind === 'store' ? `District store · ${nodeMap[h.nodeId]?.name ?? ''}` : h.kind === 'supplier' ? 'Supplier' : 'Exit';

export const isServed = (s: Pick<Store, 'animals'>, householdId: string) =>
    s.animals.some(a => a.holder.kind === 'household' && a.holder.id === householdId && !['Deceased', 'Lost', 'Culled', 'Closed Chain'].includes(a.status) && !a.damId);
/** A household "holds" any live animal, calves included. */
export const holdsAny = (s: Pick<Store, 'animals'>, householdId: string) =>
    s.animals.some(a => a.holder.kind === 'household' && a.holder.id === householdId && !['Deceased', 'Lost', 'Culled', 'Closed Chain'].includes(a.status));
export const hasEverReceived = (s: Pick<Store, 'transfers'>, householdId: string) =>
    s.transfers.some(t => t.to.id === householdId && t.state === 'Completed' && (t.type === 'primary' || t.type === 'pass_on' || t.type === 'replacement'));

// ---------- Pass-on tasks (REQ-26..28) ----------
export type PassOnColumn = 'Task created' | 'Nominated' | 'Approved' | 'Handed over' | 'Confirmed';
export const passOnColumns: PassOnColumn[] = ['Task created', 'Nominated', 'Approved', 'Handed over', 'Confirmed'];
export interface PassOnTask {
    calfId: string; damId: string; holder: HolderRef; eligibleDate: string; due: boolean; transfer?: Transfer;
    column: PassOnColumn; ageDays: number; severity: 'ok' | 'amber' | 'red'; daysUntilDue: number;
}
export function passOnTasks(s: Store, nowMs = Date.now()): PassOnTask[] {
    const out: PassOnTask[] = [];
    const dams = new Set(s.animals.filter(a => a.damId).map(a => a.damId!));
    for (const damId of dams) {
        const calves = s.animals.filter(a => a.damId === damId && a.sex === 'Female').sort((a, b) => a.dob.localeCompare(b.dob));
        const done = s.transfers.find(t => t.type === 'pass_on' && t.state === 'Completed' && calves.some(c => c.id === t.animalId));
        const candidate = done ? calves.find(c => c.id === done.animalId) : calves.find(c => !['Deceased', 'Lost', 'Culled'].includes(c.status));
        if (!candidate) continue;
        const eligibleDate = addMonths(candidate.dob, s.config.passOnAgeMonths);
        const daysUntilDue = daysBetween(nowMs, eligibleDate);
        const transfer = [...s.transfers].reverse().find(t => t.animalId === candidate.id && t.type === 'pass_on' && !['Cancelled', 'Rejected'].includes(t.state));
        const column: PassOnColumn = !transfer ? 'Task created' : transfer.state === 'Completed' ? 'Confirmed' : ['Dispatched', 'Received', 'Disputed'].includes(transfer.state) ? 'Handed over' : transfer.state === 'Approved' ? 'Approved' : 'Nominated';
        const end = column === 'Confirmed' && transfer?.completedAt ? new Date(transfer.completedAt).getTime() : nowMs;
        const ageDays = Math.max(0, daysBetween(eligibleDate, end));
        const severity = column === 'Confirmed' || daysUntilDue > 0 ? 'ok' : ageDays > s.config.passOnRedDays ? 'red' : ageDays > s.config.passOnAmberDays ? 'amber' : 'ok';
        out.push({ calfId: candidate.id, damId, holder: candidate.holder, eligibleDate, due: daysUntilDue <= 0, transfer, column, ageDays, severity, daysUntilDue });
    }
    return out;
}

// ---------- Request validation (REQ-14) ----------
export interface RuleError { rule: string; field: string; message: string }
export interface TransferInput { type: TransferType; animalId: string; from: HolderRef; to: HolderRef; plannedDate: string; reason: string }
const holdStatuses = ['With Holder', 'Pregnant', 'Lactating'];
export function validateTransfer(s: Store, input: TransferInput, nowMs = Date.now(), excludeId?: string): RuleError[] {
    const errs: RuleError[] = [];
    const err = (rule: string, field: string, message: string) => errs.push({ rule, field, message });
    const animal = s.animals.find(a => a.id === input.animalId);
    if (!animal) { err('animal_exists', 'animalId', 'Select an animal.'); return errs; }
    if (s.transfers.some(t => t.id !== excludeId && t.animalId === animal.id && openStates.includes(t.state)))
        err('one_open_transfer', 'animalId', 'This animal already has an open transfer (REQ-14).');
    const allowed = input.type === 'primary' || input.type === 'replacement' ? ['In District Store'] : input.type === 'reversal' ? ['In District Store', ...holdStatuses] : holdStatuses;
    if (s.exits.some(e => e.animalId === animal.id && e.state === 'Pending Verification')) err('pending_exit', 'animalId', 'A death or loss for this animal is awaiting verification.');
    if (!allowed.includes(animal.status)) err('animal_status', 'animalId', `Animal status "${animal.status}" does not allow a ${input.type.replace('_', '-')} transfer.`);
    if (animal.holder.id !== input.from.id) err('sender_matches', 'from', 'The sending holder is not the animal’s current holder.');
    if (!input.plannedDate) err('planned_date', 'plannedDate', 'A planned date is required.');
    else if (new Date(input.plannedDate).getTime() < nowMs - 2 * DAY) err('planned_date', 'plannedDate', 'The planned date cannot be in the past.');
    if (!input.reason.trim()) err('reason', 'reason', 'A reason is required.');
    if (input.from.id === input.to.id) err('same_holder', 'to', 'Sender and receiver are the same.');
    const receiver = input.to.kind === 'household' ? s.households.find(h => h.id === input.to.id) : undefined;
    const needsHousehold = ['primary', 'pass_on', 'replacement'].includes(input.type);
    if (needsHousehold && input.to.kind !== 'household') err('receiver_type', 'to', 'The receiver must be a household.');
    if (input.type === 'return' && input.to.kind !== 'store') err('receiver_type', 'to', 'An animal can only be returned to the district store.');
    if (input.type === 'primary' && input.from.kind !== 'store') err('sender_type', 'from', 'A primary transfer leaves the district store.');
    if (input.type === 'pass_on' || input.type === 'return') {
        if (input.from.kind !== 'household') err('sender_type', 'from', 'This transfer must start from a household.');
    }
    if (input.type === 'pass_on') {
        const task = passOnTasks(s, nowMs).find(t => t.calfId === animal.id);
        if (!task) err('pass_on_calf', 'animalId', 'Only the first female calf of a Girinka cow can be passed on (REQ-26).');
        else if (!task.due) err('pass_on_age', 'animalId', `The calf reaches pass-on age (${s.config.passOnAgeMonths} months) on ${task.eligibleDate.slice(0, 10)}.`);
    }
    if (needsHousehold && receiver) {
        if (input.type === 'replacement') {
            const exit = s.exits.find(e => e.state === 'Verified' && !e.reversalOf && s.animals.find(a => a.id === e.animalId) && e.holderId === receiver.id && ['death', 'loss'].includes(e.category));
            const orig = exit && s.transfers.find(t => t.animalId === exit.animalId && t.type === 'primary' && t.state === 'Completed' && t.to.id === receiver.id);
            if (!exit) err('replacement_evidence', 'to', 'A replacement needs a verified death or loss record with evidence for this household (REQ-19).');
            else if (orig?.completedAt && daysBetween(orig.completedAt, exit.date) > s.config.replacementWindowMonths * 30.4) err('replacement_window', 'to', `The loss happened more than ${s.config.replacementWindowMonths} months after the primary transfer.`);
            if (holdsAny(s, receiver.id)) err('already_holds', 'to', 'The household already holds a live animal.');
        } else {
            if (receiver.status !== 'Eligible') err('receiver_eligible', 'to', `The household is "${receiver.status}", not Eligible (REQ-14).`);
            if (holdsAny(s, receiver.id) || hasEverReceived(s, receiver.id)) err('already_served', 'to', 'This household is already served and cannot be selected again.');
        }
    }
    if (input.type === 'primary' && receiver) {
        const list = s.lists.find(l => l.type === 'beneficiary' && l.locked && l.step === 'Approved' && l.householdIds.includes(receiver.id));
        if (!list) err('approved_list', 'to', 'The household is not on an approved beneficiary list (REQ-09).');
        const sector = ancestorAt(receiver.villageId, 'sector');
        const target = s.targets.find(t => t.nodeId === sector?.id);
        if (sector && target) {
            const used = s.transfers.filter(t => t.type === 'primary' && !['Cancelled', 'Rejected'].includes(t.state) && ancestorAt(t.to.nodeId, 'sector')?.id === sector.id).length;
            if (used >= target.animals) err('quota', 'to', `The ${sector.name} sector quota (${target.animals}) is used up.`);
        }
    }
    if (input.type === 'move' && input.to.kind === 'household' && !receiver) err('receiver_exists', 'to', 'Choose a registered household.');
    return errs;
}

// ---------- Health index (REQ-32) ----------
export type HealthStatus = 'Good' | 'Watch' | 'At Risk';
export function healthIndex(s: Store, animal: Animal, nowMs = Date.now()): { status: HealthStatus; rule: string } {
    const events = s.healthEvents.filter(e => e.animalId === animal.id);
    const bcs = [...events].filter(e => e.type === 'body_condition' && e.score).sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastVax = [...events].filter(e => e.type === 'vaccination').sort((a, b) => b.date.localeCompare(a.date))[0];
    const visits = s.visits.filter(v => animal.holder.kind === 'household' && v.householdId === animal.holder.id).sort((a, b) => b.date.localeCompare(a.date));
    if (bcs && bcs.score! <= 2) return { status: 'At Risk', rule: 'R1: latest body condition score is 2 or lower' };
    if (visits.length >= 2 && visits[0].animal === 'poor' && visits[1].animal === 'poor') return { status: 'At Risk', rule: 'R2: two consecutive poor animal-condition visits' };
    const vaxAge = lastVax ? daysBetween(lastVax.date, nowMs) : Infinity;
    if (vaxAge > s.config.vaccineIntervalDays * 1.5) return { status: 'Watch', rule: 'R3: vaccination more than 1.5 intervals overdue' };
    if (vaxAge > s.config.vaccineIntervalDays) return { status: 'Watch', rule: 'R4: vaccination due' };
    if (visits[0]?.animal === 'poor') return { status: 'Watch', rule: 'R5: latest visit rated poor' };
    return { status: 'Good', rule: 'No health rule triggered' };
}

// ---------- Alerts (REQ-38) ----------
export interface Alert {
    id: string; rule: string; severity: 'info' | 'warning' | 'critical'; nodeId: string; ownerRole: Role; text: string; link: string; since: string; due: string; state?: AlertState;
}
const alertDue = (since: string, days: number) => new Date(new Date(since).getTime() + days * DAY).toISOString();
export function computeAlerts(s: Store, nowMs = Date.now()): Alert[] {
    const out: Alert[] = [];
    const push = (a: Omit<Alert, 'state' | 'due'> & { dueDays?: number }) => { const { dueDays, ...rest } = a; out.push({ ...rest, due: alertDue(a.since, dueDays ?? 3), state: s.alertStates[a.id] }); };
    for (const t of s.transfers) {
        const animal = s.animals.find(a => a.id === t.animalId);
        if (t.state === 'Dispatched' && t.dispatch && nowMs - new Date(t.dispatch.ts).getTime() > s.config.receiptHours * 3_600_000)
            push({ id: `receipt_overdue:${t.id}`, rule: 'Receipt overdue', severity: 'warning', nodeId: t.to.nodeId, ownerRole: 'cell_officer', text: `${animal?.tag ?? t.animalId} dispatched ${daysBetween(t.dispatch.ts, nowMs)} day(s) ago, receipt not confirmed (${t.id})`, link: `/transfers/${t.id}`, since: t.dispatch.ts, dueDays: 1 });
        if (t.state === 'Disputed') push({ id: `disputed:${t.id}`, rule: 'Disputed receipt', severity: 'critical', nodeId: t.to.nodeId, ownerRole: 'district_coordinator', text: `Tag mismatch on ${t.id}: ${animal?.tag ?? t.animalId}`, link: `/transfers/${t.id}`, since: t.history[t.history.length - 1]?.ts ?? t.createdAt, dueDays: 2 });
    }
    for (const task of passOnTasks(s, nowMs)) {
        if (task.severity === 'ok' || task.column === 'Confirmed') continue;
        const calf = s.animals.find(a => a.id === task.calfId);
        push({ id: `pass_on:${task.calfId}`, rule: 'Pass-on overdue', severity: task.severity === 'red' ? 'critical' : 'warning', nodeId: task.holder.nodeId, ownerRole: 'village_agent', text: `Pass-on of ${calf?.tag} open ${task.ageDays} days (${task.column})`, link: '/pass-on', since: task.eligibleDate, dueDays: 7 });
    }
    for (const e of s.exits) if (e.state === 'Pending Verification' && daysBetween(e.recordedAt, nowMs) > s.config.exitVerifyDays) {
        const a = s.animals.find(x => x.id === e.animalId);
        push({ id: `exit_unverified:${e.id}`, rule: 'Death without evidence', severity: 'critical', nodeId: e.nodeId, ownerRole: 'sector_officer', text: `${a?.tag} ${e.category} not verified after ${daysBetween(e.recordedAt, nowMs)} days`, link: '/animals/' + e.animalId, since: e.recordedAt, dueDays: 2 });
    }
    const sectors = Object.values(nodeMap).filter(n => n.level === 'sector');
    for (const sec of sectors) {
        const backlog = s.transfers.filter(t => ['Submitted', 'Pending Next Approval'].includes(t.state) && isWithin(t.to.nodeId, sec.id)).length;
        if (backlog > s.config.approvalBacklog) push({ id: `backlog:${sec.id}`, rule: 'Approval backlog', severity: 'warning', nodeId: sec.id, ownerRole: 'sector_officer', text: `${backlog} transfers awaiting approval in ${sec.name}`, link: '/approvals', since: new Date(nowMs).toISOString() });
        const served = s.households.filter(h => isWithin(h.villageId, sec.id) && holdsAny(s, h.id));
        if (served.length) {
            const covered = served.filter(h => s.visits.some(v => v.householdId === h.id && daysBetween(v.date, nowMs) <= s.config.visitIntervalDays)).length;
            const pct = Math.round((covered / served.length) * 100);
            if (pct < s.config.visitCoveragePct) push({ id: `coverage:${sec.id}`, rule: 'Low visit coverage', severity: 'warning', nodeId: sec.id, ownerRole: 'sector_officer', text: `Monitoring visits cover ${pct}% of served households in ${sec.name} (target ${s.config.visitCoveragePct}%)`, link: '/households', since: new Date(nowMs).toISOString(), dueDays: 14 });
        }
    }
    for (const h of s.households) {
        const v = s.visits.filter(x => x.householdId === h.id).sort((a, b) => b.date.localeCompare(a.date));
        if (v.length >= 2 && v[0].animal === 'poor' && v[1].animal === 'poor') push({ id: `poor_visits:${h.id}`, rule: 'Poor condition twice', severity: 'warning', nodeId: h.villageId, ownerRole: 'sector_officer', text: `${h.headName}: two consecutive poor animal-condition visits`, link: `/households/${h.id}`, since: v[0].date, dueDays: 7 });
    }
    for (const a of s.animals) {
        if (a.holder.kind !== 'household' || ['Deceased', 'Lost', 'Culled', 'Closed Chain'].includes(a.status) || daysBetween(a.dob, nowMs) < 120) continue;
        const last = s.healthEvents.filter(e => e.animalId === a.id && e.type === 'vaccination').sort((x, y) => y.date.localeCompare(x.date))[0];
        if (!last || daysBetween(last.date, nowMs) > s.config.vaccineIntervalDays)
            push({ id: `vaccination:${a.id}`, rule: 'Vaccination due', severity: 'info', nodeId: a.holder.nodeId, ownerRole: 'village_agent', text: `${a.tag}: vaccination due${last ? ` (last ${last.date.slice(0, 10)})` : ' (none recorded)'}`, link: `/animals/${a.id}`, since: last ? addMonths(last.date, 0) : a.dob, dueDays: 7 });
        if (!verifyLedger(a).ok) push({ id: `chain_hash:${a.id}`, rule: 'Chain hash mismatch', severity: 'critical', nodeId: 'RW', ownerRole: 'system_admin', text: `Ledger verification failed for ${a.tag}`, link: `/animals/${a.id}`, since: new Date(nowMs).toISOString(), dueDays: 1 });
    }
    const rank = { critical: 0, warning: 1, info: 2 };
    return out.sort((x, y) => rank[x.severity] - rank[y.severity] || x.since.localeCompare(y.since));
}
export const alertsFor = (s: Store, user: User) => computeAlerts(s).filter(a => user.role === 'household' ? false : (inScope(user, a.nodeId) || a.nodeId === 'RW' && ['system_admin', 'national_officer', 'auditor'].includes(user.role)));

// ---------- Imihigo targets (REQ-39) ----------
export function targetProgress(s: Store, nodeId: string, nowMs = Date.now()) {
    const year = new Date(nowMs).getFullYear();
    const target = s.targets.filter(t => t.nodeId === nodeId && t.year === year).sort((a, b) => b.version - a.version)[0];
    const done = s.transfers.filter(t => t.state === 'Completed' && ['primary', 'pass_on', 'replacement'].includes(t.type) && isWithin(t.to.nodeId, nodeId) && new Date(t.completedAt ?? t.createdAt).getFullYear() === year);
    const last90 = done.filter(t => daysBetween(t.completedAt ?? t.createdAt, nowMs) <= 90).length;
    const daysLeft = daysBetween(nowMs, `${year}-12-31`);
    const achieved = done.length;
    const projected = Math.round(achieved + (last90 / 90) * daysLeft);
    return { target: target?.animals ?? 0, households: target?.households ?? 0, achieved, pct: target?.animals ? Math.round((achieved / target.animals) * 100) : 0, projected, method: 'Linear: achieved so far + (completions in the last 90 days ÷ 90) × days left in the year' };
}

export const maskNid = (nid: string) => `${nid.slice(0, 1)}•••••••••••${nid.slice(-4)}`;
export const maskPhone = (p: string) => p.replace(/\d(?=\d{3})/g, '•');
export const ageInMonths = (dob: string, nowMs = Date.now()) => Math.floor(daysBetween(dob, nowMs) / 30.44);
export const exitedStatuses = ['Deceased', 'Lost', 'Culled', 'Closed Chain'];

export const productListHas = (type: keyof typeof productList, product: string) => (productList[type] as readonly string[]).includes(product);
