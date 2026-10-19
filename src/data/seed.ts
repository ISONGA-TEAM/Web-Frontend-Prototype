// Fictional demo data for the Nyabihu pilot. Every name, ID and number below is invented.
// Dates are relative to "now" so the dashboards always show a realistic mix of on-time and overdue work.
import { allNodes, ancestorAt, pilotSectors, sectorId, storeOf } from './hierarchy';
import { girinkaCriteria } from './criteria';
import { appendLedger, addMonths, DAY } from '../lib/rules';
import type { Animal, AnimalStatus, Config, ExitEvent, HolderRef, Household, SelectionList, Store, Target, Transfer, TransferState, TransferType, User } from '../types';

export const demoPassword = 'Isonga2026!';
const first = ['Jean', 'Alice', 'Marie', 'Eric', 'Solange', 'Claudine', 'Emmanuel', 'Beatrice', 'David', 'Odette', 'Paul', 'Immaculee', 'Silas', 'Jeanne', 'Aimable', 'Vestine', 'Theogene', 'Francine', 'Innocent', 'Pacifique'];
const last = ['Habimana', 'Ingabire', 'Uwimana', 'Mugabo', 'Mukamana', 'Uwase', 'Ntakirutimana', 'Nyirahabimana', 'Gakwaya', 'Mutanguha', 'Kamanzi', 'Niyonsenga', 'Mukeshimana', 'Hakizimana', 'Nsengimana', 'Uwizeye'];
const nameAt = (i: number) => `${last[(i * 7 + 3) % last.length].toUpperCase()} ${first[(i * 5 + 1) % first.length]}`;

export function defaultConfig(): Config {
    return { passOnAgeMonths: 12, replacementWindowMonths: 12, receiptHours: 72, passOnAmberDays: 30, passOnRedDays: 60, exitVerifyDays: 14, approvalBacklog: 20, visitCoveragePct: 60, visitIntervalDays: 90, vaccineIntervalDays: 180 };
}

export function buildUsers(): User[] {
    const u = (id: string, name: string, username: string, role: User['role'], nodeId: string, householdId?: string): User => ({ id, name, username, email: `${username}@example.com`, role, nodeId, householdId });
    const users: User[] = [
        u('U-admin', 'Eric Mugabo', 'admin.demo', 'system_admin', 'RW'),
        u('U-national', 'Odette Kamanzi', 'national.demo', 'national_officer', 'RW'),
        u('U-auditor', 'Theogene Nsengimana', 'auditor.demo', 'auditor', 'RW'),
        u('U-province', 'Vestine Uwizeye', 'province.demo', 'provincial_officer', 'P-W'),
        u('U-district', 'Jean Habimana', 'district.demo', 'district_coordinator', 'D-NYB'),
        u('U-district2', 'Claudine Uwase', 'district2.demo', 'district_coordinator', 'D-NYB'),
        u('U-sector-BIG', 'Alice Ingabire', 'sector.demo', 'sector_officer', 'S-BIG'),
        u('U-cell-BIG-1', 'Emmanuel Niyonsenga', 'cell.demo', 'cell_officer', 'C-BIG-1'),
        u('U-agent-BIG-1-1', 'Marie Uwimana', 'agent.demo', 'village_agent', 'V-BIG-1-1'),
        u('U-hh-0', 'Solange Mukamana', 'household.demo', 'household', 'V-BIG-1-1', 'HH-0001'),
    ];
    let i = 0;
    for (const n of allNodes) {
        const name = `${first[(i * 3 + 2) % first.length]} ${last[(i * 5 + 1) % last.length]}`; i++;
        const slug = n.id.replace(/^[A-Z]-/, '').toLowerCase();
        if (n.level === 'sector' && n.id !== 'S-BIG') users.push(u(`U-sector-${n.id.slice(2)}`, name, `sector.${slug}`, 'sector_officer', n.id));
        if (n.level === 'cell' && n.id !== 'C-BIG-1') users.push(u(`U-cell-${n.id.slice(2)}`, name, `cell.${slug}`, 'cell_officer', n.id));
        if (n.level === 'village' && n.id !== 'V-BIG-1-1') users.push(u(`U-agent-${n.id.slice(2)}`, name, `agent.${slug}`, 'village_agent', n.id));
    }
    return users;
}

export function buildSeed(nowMs = Date.now()): Store {
    const ago = (days: number) => new Date(nowMs - days * DAY).toISOString();
    const users = buildUsers();
    const villages = allNodes.filter(n => n.level === 'village');
    const userAt = (role: User['role'], nodeId: string) => users.find(x => x.role === role && x.nodeId === nodeId)!;
    const district = users.find(x => x.id === 'U-district')!;
    const district2 = users.find(x => x.id === 'U-district2')!;
    const store: HolderRef = { kind: 'store', id: storeOf('D-NYB'), nodeId: 'D-NYB' };
    const hhRef = (h: Household): HolderRef => ({ kind: 'household', id: h.id, nodeId: h.villageId });

    // ---- Households: 0-25 served, 26-41 eligible and unserved, 42-51 registered, 52-56 needs review, 57-59 not eligible
    const households: Household[] = Array.from({ length: 60 }, (_, i) => {
        const status: Household['status'] = i < 42 ? 'Eligible' : i < 52 ? 'Registered' : i < 57 ? 'Needs Review' : 'Not Eligible';
        const village = villages[i % villages.length];
        const registeredOn = ago(i < 26 ? 330 - i * 8 : 120 - (i % 40) * 2);
        const h: Household = {
            id: `HH-${String(i + 1).padStart(4, '0')}`, headName: i === 0 ? 'MUKAMANA Solange' : nameAt(i), nid: `11985${String(80000000000 + i * 7919).padStart(11, '0')}`, verification: i % 3 === 0 ? 'lookup' : 'manual',
            sex: i % 3 === 0 ? 'M' : 'F', dob: `19${60 + (i % 35)}-0${1 + (i % 9)}-1${i % 9}`, size: 3 + (i % 6), villageId: village.id, phone: `078${String(1000000 + i * 3217).padStart(7, '0')}`,
            shelter: i % 4 === 0 ? 'Cowshed to be built, 2 ha of land' : 'Small plot with space for a shed', vulnerability: [['Female-headed'], ['Elderly head'], ['Landless / small plot'], []][i % 4], status, registeredOn, assessments: [], consentOn: registeredOn,
        };
        if (status !== 'Registered') {
            const answers = girinkaCriteria.map((c, k): Household['assessments'][number]['criteria'][number] => ({ key: c.key, answer: status === 'Not Eligible' ? k !== 0 : true, evidence: status === 'Needs Review' && k === 3 ? 'none' : (['document', 'visit', 'witness'] as const)[(i + k) % 3] }));
            h.assessments.push({ id: `AS-${String(i + 1).padStart(4, '0')}`, date: new Date(new Date(registeredOn).getTime() + 5 * DAY).toISOString(), assessorId: userAt('cell_officer', ancestorAt(h.villageId, 'cell')!.id).id, result: status, criteria: answers });
        }
        return h;
    });

    // ---- Animals and transfers
    const animals: Animal[] = []; const transfers: Transfer[] = []; let tn = 0; let an = 0;
    const mkAnimal = (tag: string, o: { ageDays?: number; dob?: string; sex?: Animal['sex']; dam?: Animal } = {}): Animal => {
        const id = `AN-${String(++an).padStart(4, '0')}`;
        const dob = o.dob ?? ago(o.ageDays ?? 1300);
        const born = !!o.dam;
        const regTs = born ? dob : ago(400);
        const status: AnimalStatus = born ? 'With Holder' : 'In District Store';
        let a: Animal = {
            id, tag, breed: o.dam?.breed ?? ['Friesian cross', 'Inyambo', 'Jersey cross'][an % 3], sex: o.sex ?? 'Female', dob, dobEstimated: !born && an % 4 === 0, colour: ['Black and white', 'Brown', 'Red'][an % 3],
            source: born ? `Born to ${o.dam!.tag}` : 'Supplier (demo)', damId: o.dam?.id, status, holder: o.dam?.holder ?? store, statusHistory: [{ ts: regTs, status, ref: born ? 'calving' : 'registration' }], ledger: [],
        };
        a = appendLedger(a, 'registration', born ? `BIRTH-${id}` : `REG-${id}`, born ? o.dam!.tag : 'Supplier (demo)', a.holder.id, regTs);
        animals.push(a);
        return a;
    };
    const mkTransfer = (type: TransferType, a: Animal, from: HolderRef, to: HolderRef, state: TransferState, createdDaysAgo: number, chain: User['role'][], approvers: User[], creator: User, extra: Partial<Transfer> = {}): Transfer => {
        const t: Transfer = { id: `TR-${String(++tn).padStart(4, '0')}`, type, animalId: a.id, from, to, state: 'Draft', createdBy: creator.id, createdAt: ago(createdDaysAgo), plannedDate: ago(createdDaysAgo - 3).slice(0, 10), reason: type === 'primary' ? 'First allocation under the district plan' : type === 'pass_on' ? 'Pass-on of the first female calf' : 'Replacement after verified loss', approvals: [], history: [{ ts: ago(createdDaysAgo), by: creator.id, state: 'Draft', note: 'Created' }], chain, ...extra };
        const push = (st: TransferState, d: number, by = creator.id, note = '') => { t.state = st; t.history.push({ ts: ago(d), by, state: st, note }); };
        const order: TransferState[] = ['Submitted', 'Pending Next Approval', 'Approved', 'Dispatched', 'Received', 'Completed'];
        const reached = (s: TransferState) => order.indexOf(state) >= order.indexOf(s);
        const approvalsDone = ['Approved', 'Dispatched', 'Received', 'Completed', 'Disputed'].includes(state) ? chain.length : state === 'Pending Next Approval' ? 1 : 0;
        if (state !== 'Draft') push('Submitted', createdDaysAgo - 0.1);
        for (let k = 0; k < approvalsDone; k++) {
            t.approvals.push({ level: k, role: chain[k], approverId: approvers[k].id, decision: 'approve', comment: '', ts: ago(createdDaysAgo - 0.5 - k * 0.3) });
            if (k < approvalsDone - 1) push('Pending Next Approval', createdDaysAgo - 0.5 - k * 0.3, approvers[k].id);
        }
        if (state === 'Pending Next Approval') push('Pending Next Approval', createdDaysAgo - 0.5, approvers[0].id);
        if (approvalsDone === chain.length && state !== 'Draft') push('Approved', createdDaysAgo - 1.5, approvers[approvalsDone - 1].id);
        if (state === 'Returned') { t.approvals.push({ level: 0, role: chain[0], approverId: approvers[0].id, decision: 'return', comment: 'Please confirm the shelter before resubmitting', ts: ago(createdDaysAgo - 1) }); push('Returned', createdDaysAgo - 1, approvers[0].id, 'Please confirm the shelter before resubmitting'); }
        if (state === 'Rejected') { t.approvals.push({ level: 0, role: chain[0], approverId: approvers[0].id, decision: 'reject', comment: 'Household moved out of the village', ts: ago(createdDaysAgo - 1) }); push('Rejected', createdDaysAgo - 1, approvers[0].id, 'Household moved out of the village'); }
        if (state === 'Cancelled') push('Cancelled', createdDaysAgo - 1, creator.id, 'Superseded by another allocation');
        if (reached('Dispatched') || state === 'Disputed') {
            const dd = state === 'Dispatched' ? (extra.dispatch ? 0.5 : 4) : createdDaysAgo - 3;
            t.dispatch = extra.dispatch ?? { ts: ago(dd), sender: 'Store keeper (demo)', senderNid: '1197880000000001', transport: 'District truck', photos: ['tag-front.jpg'], gps: '-1.65, 29.45' };
            t.prevStatus = a.status; a.status = 'Allocated (In Transit)'; a.statusHistory.push({ ts: t.dispatch.ts, status: a.status, ref: t.id });
            push('Dispatched', dd);
        }
        if (state === 'Disputed') { t.receipt = { ts: ago(1), by: 'U-cell', tagRead: 'RW-GN-0000', sex: 'Female', condition: 'fair', remarks: 'Tag on the animal differs' }; push('Disputed', 1, 'U-cell', 'Tag or sex does not match the transfer record'); }
        if (reached('Received') && state !== 'Dispatched') { const rcv = createdDaysAgo - 6; t.receipt = { ts: ago(rcv), by: approvers[approvers.length - 1].id, tagRead: a.tag, sex: a.sex, condition: 'good', remarks: '' }; push('Received', rcv); }
        if (state === 'Completed') {
            const doneAgo = createdDaysAgo - 7;
            if (type === 'primary' || type === 'pass_on') t.ack = { ts: ago(doneAgo), method: 'otp', device: 'Field PWA' };
            t.completedAt = ago(doneAgo); push('Completed', doneAgo);
            a.holder = to; a.status = (extra.prevStatus === 'Lactating' || extra.prevStatus === 'Pregnant') ? extra.prevStatus : to.kind === 'store' ? 'In District Store' : 'With Holder';
            a.statusHistory.push({ ts: ago(doneAgo), status: a.status, ref: t.id });
            a.ledger = appendLedger(a, 'transfer', t.id, from.id, to.id, ago(doneAgo)).ledger;
        }
        transfers.push(t);
        return t;
    };
    const sectorOfficer = (nodeId: string) => userAt('sector_officer', ancestorAt(nodeId, 'sector')!.id);
    const cellOfficer = (nodeId: string) => userAt('cell_officer', ancestorAt(nodeId, 'cell')!.id);
    const agentOf = (nodeId: string) => userAt('village_agent', nodeId);
    const primaryChain: User['role'][] = ['sector_officer', 'district_coordinator'];

    // Served households: a cow each, completed primary transfer.
    const dams: Animal[] = [];
    for (let i = 0; i < 26; i++) {
        const hh = households[i];
        const cow = mkAnimal(`RW-GN-${String(i + 1).padStart(4, '0')}`, { ageDays: 1200 + i * 17 });
        const completedAgo = 300 - i * 9;
        mkTransfer('primary', cow, store, hhRef(hh), 'Completed', completedAgo + 7, primaryChain, [sectorOfficer(hh.villageId), district2], district);
        if (i === 25) continue; // replacement scenario below
        if (i % 3 === 1 && i !== 1) { cow.status = 'Pregnant'; cow.pregnancyCheck = ago(i === 4 ? 255 : 90 + i * 3); }
        else if (i % 3 === 2 || i === 0 || i === 1) cow.status = 'Lactating';
        dams.push(cow);
    }

    // Pass-on scenarios ------------------------------------------------------------
    const eligAgo = (days: number) => addMonths(ago(days), -12); // dob so that the calf became eligible `days` ago
    const calf = (tag: string, dam: Animal, dob: string, sex: Animal['sex'] = 'Female') => mkAnimal(tag, { dob, sex, dam });
    const holderOf = (cow: Animal) => households.find(h => h.id === cow.holder.id)!;
    const calvings: Store['calvings'] = [];
    const record = (dam: Animal, c: Animal) => calvings.push({ id: `CV-${String(calvings.length + 1).padStart(4, '0')}`, damId: dam.id, date: c.dob, calfIds: [c.id], complications: '', recordedBy: 'U-seed' });
    const cA = calf('RW-GN-1001', dams[0], eligAgo(95)); record(dams[0], cA);                     // red, nothing started (demo agent)
    const cB = calf('RW-GN-1002', dams[1], eligAgo(35)); record(dams[1], cB);                     // amber, nominated
    const cC = calf('RW-GN-1003', dams[4], eligAgo(10)); record(dams[4], cC);                     // approved
    const cD = calf('RW-GN-1004', dams[7], eligAgo(20)); record(dams[7], cD);                     // dispatched
    const cE = calf('RW-GN-1005', dams[10], eligAgo(40)); record(dams[10], cE);                   // confirmed
    const cF = calf('RW-GN-1006', dams[13], eligAgo(-20)); record(dams[13], cF);                  // due in 20 days
    const cG = calf('RW-GN-1007', dams[16], addMonths(ago(0), -8), 'Male'); record(dams[16], cG); // male, not subject to pass-on
    // first female calf dies; the next female calf becomes eligible
    const cH1 = calf('RW-GN-1008', dams[19], eligAgo(200)); record(dams[19], cH1);
    const cH2 = calf('RW-GN-1009', dams[19], eligAgo(-5)); record(dams[19], cH2);

    // Receivers: eligible and not yet served
    const eligible = households.slice(26, 42);
    const recv = (i: number) => eligible[i];
    const hhOfCalf = (c: Animal) => holderOf(c);
    mkTransfer('pass_on', cB, cB.holder, hhRef(recv(7)), 'Submitted', 8, ['cell_officer', 'sector_officer'], [], agentOf(hhOfCalf(cB).villageId));
    mkTransfer('pass_on', cC, cC.holder, hhRef(recv(8)), 'Approved', 6, ['cell_officer', 'sector_officer'], [cellOfficer(hhOfCalf(cC).villageId), sectorOfficer(hhOfCalf(cC).villageId)], agentOf(hhOfCalf(cC).villageId));
    mkTransfer('pass_on', cD, cD.holder, hhRef(recv(9)), 'Dispatched', 7, ['cell_officer', 'sector_officer'], [cellOfficer(hhOfCalf(cD).villageId), sectorOfficer(hhOfCalf(cD).villageId)], agentOf(hhOfCalf(cD).villageId), { dispatch: { ts: ago(0.6), sender: nameAt(4), senderNid: '1198580000000009', transport: 'On foot', photos: ['calf.jpg'], gps: '-1.62, 29.50' } });
    mkTransfer('pass_on', cE, cE.holder, hhRef(recv(10)), 'Completed', 22, ['cell_officer', 'sector_officer'], [cellOfficer(hhOfCalf(cE).villageId), sectorOfficer(hhOfCalf(cE).villageId)], agentOf(hhOfCalf(cE).villageId));
    // cH1 died (verified exit) so cH2 is the candidate
    const exits: ExitEvent[] = [];
    const exitFor = (a: Animal, category: ExitEvent['category'], state: ExitEvent['state'], daysAgo: number, evidence: ExitEvent['evidence'] = 'vet_certificate'): ExitEvent => {
        const holder = a.holder;
        const e: ExitEvent = { id: `EX-${String(exits.length + 1).padStart(4, '0')}`, animalId: a.id, date: ago(daysAgo).slice(0, 10), category, cause: category === 'death' ? 'East Coast fever (demo)' : category === 'loss' ? 'Lost while grazing (demo)' : 'Culled on vet advice (demo)', evidence, reportedBy: agentOf(holder.nodeId)?.id ?? 'U-seed', state, verifiedBy: state === 'Verified' ? 'U-sector' : undefined, recordedAt: ago(daysAgo), holderId: holder.id, nodeId: holder.nodeId };
        exits.push(e);
        if (state === 'Verified') {
            a.status = category === 'death' ? 'Deceased' : category === 'loss' ? 'Lost' : 'Culled';
            a.statusHistory.push({ ts: ago(daysAgo), status: a.status, ref: e.id });
            a.ledger = appendLedger(a, 'exit', e.id, holder.id, 'exit', ago(daysAgo)).ledger;
            a.holder = { kind: 'exit', id: 'exit', nodeId: holder.nodeId };
        }
        return e;
    };
    exitFor(cH1, 'death', 'Verified', 60);
    // Replacement scenario: household 26's cow (index 25) died 50 days ago, verified
    exitFor(animals.find(a => a.tag === 'RW-GN-0026')!, 'death', 'Verified', 50);
    // A closed chain (exited and closed)
    const cI = mkAnimal('RW-GN-0090', { ageDays: 1500 }); cI.holder = hhRef(households[11]); cI.status = 'With Holder'; cI.ledger = appendLedger(cI, 'transfer', 'TR-LEGACY', store.id, households[11].id, ago(350)).ledger;
    exitFor(cI, 'loss', 'Verified', 120);
    cI.status = 'Closed Chain'; cI.statusHistory.push({ ts: ago(100), status: 'Closed Chain', ref: 'close' }); cI.closedOn = ago(100); cI.ledger = appendLedger(cI, 'exit', 'CLOSE-legacy', 'exit', 'closed', ago(100)).ledger;
    // Pending verification exits: one overdue (critical), one recent
    exitFor(dams[12], 'death', 'Pending Verification', 20, 'witness_statement');
    exitFor(dams[22], 'death', 'Pending Verification', 3, 'photo');

    // District store pipeline (primary transfers still in progress)
    const storeCows = Array.from({ length: 9 }, (_, i) => mkAnimal(`RW-GN-${String(101 + i)}`, { ageDays: 900 + i * 13 }));
    const dcs = [district, district2];
    const states: TransferState[] = ['Draft', 'Submitted', 'Pending Next Approval', 'Approved', 'Dispatched', 'Disputed', 'Returned'];
    states.forEach((st, i) => {
        const to = households[26 + i];
        mkTransfer('primary', storeCows[i], store, hhRef(to), st, 9 - i, primaryChain, [sectorOfficer(to.villageId), dcs[1]], district);
    });
    // Bigogwe: a household in the demo sector waits for the demo sector officer
    // (household 41 lives in Bigogwe, cell 1) - submitted, awaiting the sector level.
    const bigT = storeCows[7];
    mkTransfer('primary', bigT, store, hhRef(households[41]), 'Submitted', 2, primaryChain, [], district);
    const canc = storeCows[8];
    mkTransfer('primary', canc, store, hhRef(households[37]), 'Cancelled', 15, primaryChain, [], district);
    mkTransfer('primary', canc, store, hhRef(households[38]), 'Rejected', 12, primaryChain, [sectorOfficer(households[38].villageId)], district);

    // ---- Approved beneficiary lists (every village with eligible unserved households), plus one in progress
    const lists: SelectionList[] = [];
    const byVillage = new Map<string, Household[]>();
    for (const h of households.slice(26, 42)) { if (h.id === 'HH-0041') continue; byVillage.set(h.villageId, [...(byVillage.get(h.villageId) ?? []), h]); }
    // household 41 (id HH-0041) is the reserved nominee for the in-progress list below
    for (const [village, hs] of byVillage) {
        const cell = ancestorAt(village, 'cell')!.id; const sec = ancestorAt(village, 'sector')!.id;
        lists.push({ id: `LS-${String(lists.length + 1).padStart(4, '0')}`, nodeId: village, type: 'beneficiary', version: 1, householdIds: hs.map(h => h.id), step: 'Approved', locked: true, log: [
            { ts: ago(80), by: agentOf(village).id, step: 'Village nomination', action: 'advance', comment: '' }, { ts: ago(75), by: userAt('cell_officer', cell).id, step: 'Cell verification', action: 'advance', comment: '' },
            { ts: ago(70), by: userAt('sector_officer', sec).id, step: 'Sector approval', action: 'advance', comment: '' }, { ts: ago(66), by: district.id, step: 'District approval', action: 'advance', comment: '' }] });
    }
    // HH-0041 (Bigogwe, village 1.1) is the in-progress list used to demo the village -> cell -> sector -> district steps.
    const v41 = households[40].villageId;
    lists.push({ id: `LS-${String(lists.length + 1).padStart(4, '0')}`, nodeId: v41, type: 'beneficiary', version: 1, householdIds: [households[40].id], step: 'Cell verification', locked: false, log: [{ ts: ago(2), by: agentOf(v41).id, step: 'Village nomination', action: 'advance', comment: '' }] });

    // ---- Health events, visits
    const healthEvents: Store['healthEvents'] = []; let he = 0;
    const addHe = (animalId: string, type: Store['healthEvents'][number]['type'], daysAgo: number, product: string, o: { score?: number; dose?: string } = {}) => healthEvents.push({ id: `HE-${String(++he).padStart(4, '0')}`, animalId, type, date: ago(daysAgo).slice(0, 10), product, dose: o.dose ?? '', score: o.score, officerId: 'U-seed', remarks: '' });
    animals.filter(a => a.holder.kind === 'household' && !a.damId).forEach((a, i) => {
        addHe(a.id, 'vaccination', i % 4 === 0 ? 260 : 40 + i * 5, 'FMD vaccine');
        addHe(a.id, 'body_condition', 30 + i * 3, 'BCS', { score: i % 9 === 0 ? 2 : 3 + (i % 2) });
        if (a.status === 'Pregnant' && a.pregnancyCheck) addHe(a.id, 'pregnancy_check', Math.round((nowMs - new Date(a.pregnancyCheck).getTime()) / DAY), 'Service / insemination date');
    });
    const visits: Store['visits'] = []; let vs = 0;
    households.slice(0, 26).forEach((h, i) => {
        if (i % 5 === 4) return; // some households not visited recently
        const poor = i === 6;
        visits.push({ id: `VS-${String(++vs).padStart(4, '0')}`, householdId: h.id, date: ago(30 + i * 2), officerId: cellOfficer(h.villageId).id, shelter: 'good', animal: poor ? 'poor' : 'good', feedWater: 'fair', issues: '' });
        if (poor) visits.push({ id: `VS-${String(++vs).padStart(4, '0')}`, householdId: h.id, date: ago(10), officerId: cellOfficer(h.villageId).id, shelter: 'fair', animal: 'poor', feedWater: 'poor', issues: 'Cow thin; fodder shortage' });
    });

    const grievances: Store['grievances'] = [
        { id: 'GR-0001', householdId: 'HH-0001', category: 'receipt', text: 'The calf tag was not fitted when it arrived (demo).', raisedOn: ago(12), routedToRole: 'sector_officer', status: 'Acknowledged', nodeId: 'V-BIG-1-1' },
        { id: 'GR-0002', householdId: 'HH-0003', category: 'eligibility', text: 'Our household was left off the village list (demo).', raisedOn: ago(41), routedToRole: 'sector_officer', status: 'Open', nodeId: households[2].villageId },
    ];

    const targets: Target[] = [{ nodeId: 'RW', year: new Date(nowMs).getFullYear(), animals: 400, households: 380, version: 1 }, { nodeId: 'P-W', year: new Date(nowMs).getFullYear(), animals: 200, households: 190, version: 1 }, { nodeId: 'D-NYB', year: new Date(nowMs).getFullYear(), animals: 70, households: 65, version: 1 }];
    pilotSectors.forEach(s => targets.push({ nodeId: sectorId(s), year: new Date(nowMs).getFullYear(), animals: 7, households: 6, version: 1 }));

    return {
        users, households, animals, transfers, exits, lists, healthEvents, visits, calvings, grievances, targets, config: defaultConfig(), alertStates: {},
        audit: [{ id: 'AU-0001', ts: ago(0.01), userId: 'U-seed', role: 'system_admin', nodeId: 'RW', action: 'seed.load', recordId: '-', result: 'ok', detail: 'Fictional demo data loaded' }], seq: 1000, grants: {}, savedViews: [],
    };
}
