// Dashboard aggregates. Everything is computed from the jurisdiction-filtered records, so totals agree at every level (REQ-06).
import { childrenOf, isWithin, nodeMap } from '../data/hierarchy';
import { computeAlerts, daysBetween, hasEverReceived, holdsAny, passOnTasks, targetProgress, healthIndex, exitedStatuses, DAY } from './rules';
import type { Visible } from './scope';
import type { Store, Transfer } from '../types';

export interface Filters { node: string; from: string; to: string; astatus: string; breed: string; ttype: string; sex: string }
export const emptyFilters = (node: string): Filters => ({ node, from: '', to: '', astatus: '', breed: '', ttype: '', sex: '' });

const inRange = (iso: string, f: Filters) => (!f.from || iso.slice(0, 10) >= f.from) && (!f.to || iso.slice(0, 10) <= f.to);

export function applyFilters(s: Store, data: Visible, f: Filters) {
    const households = data.households.filter(h => isWithin(h.villageId, f.node));
    const animals = data.animals.filter(a => isWithin(a.holder.nodeId, f.node) && (!f.astatus || a.status === f.astatus) && (!f.breed || a.breed === f.breed) && (!f.sex || (a.damId && a.sex === f.sex)));
    const transfers = data.transfers.filter(t => (isWithin(t.to.nodeId, f.node) || isWithin(t.from.nodeId, f.node)) && (!f.ttype || t.type === f.ttype) && inRange(t.createdAt, f));
    const exits = data.exits.filter(e => isWithin(e.nodeId, f.node) && inRange(e.date, f));
    const calvings = data.calvings.filter(c => { const dam = s.animals.find(a => a.id === c.damId); return !!dam && isWithin(dam.holder.nodeId, f.node) && inRange(c.date, f); });
    return { households, animals, transfers, exits, calvings };
}
export type Filtered = ReturnType<typeof applyFilters>;

const median = (xs: number[]) => { if (!xs.length) return 0; const a = [...xs].sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const mean = (xs: number[]) => xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : 0;

export function stageDurations(transfers: Transfer[]) {
    const gap = (t: Transfer, a: string, b: string) => { const x = t.history.find(h => h.state === a), y = t.history.find(h => h.state === b); return x && y ? Math.max(0, (new Date(y.ts).getTime() - new Date(x.ts).getTime()) / DAY) : null; };
    const stages: [string, string, string][] = [['Submitted', 'Approved', 'Approval'], ['Approved', 'Dispatched', 'Waiting for dispatch'], ['Dispatched', 'Received', 'In transit'], ['Received', 'Completed', 'Acknowledgment']];
    return stages.map(([a, b, label]) => { const xs = transfers.flatMap(t => { const g = gap(t, a, b); return g === null ? [] : [g]; }); return { label, n: xs.length, mean: mean(xs), median: median(xs) }; });
}

export function monthlyTrend(f: Filtered, months = 12, nowMs = Date.now()) {
    const keys = Array.from({ length: months }, (_, i) => { const d = new Date(nowMs); d.setDate(1); d.setMonth(d.getMonth() - (months - 1 - i)); return d.toISOString().slice(0, 7); });
    const row = (k: string) => ({
        month: k,
        transfers: f.transfers.filter(t => t.state === 'Completed' && (t.completedAt ?? '').slice(0, 7) === k).length,
        calvings: f.calvings.filter(c => c.date.slice(0, 7) === k).length,
        exits: f.exits.filter(e => e.state === 'Verified' && e.date.slice(0, 7) === k).length,
    });
    return keys.map(row);
}

export function summary(s: Store, f: Filtered, filters: Filters, nowMs = Date.now()) {
    const tasks = passOnTasks(s, nowMs).filter(t => isWithin(t.holder.nodeId, filters.node));
    const due = tasks.filter(t => t.due);
    const confirmedOnTime = due.filter(t => t.column === 'Confirmed' && t.ageDays <= s.config.passOnAmberDays).length;
    const completed = f.transfers.filter(t => t.state === 'Completed');
    const primaries = completed.filter(t => t.type === 'primary');
    const selectionDays = primaries.map(t => {
        const list = s.lists.find(l => l.step === 'Approved' && l.householdIds.includes(t.to.id));
        const from = list?.log[list.log.length - 1]?.ts ?? s.households.find(h => h.id === t.to.id)?.registeredOn;
        return from && t.completedAt ? Math.max(0, daysBetween(from, t.completedAt)) : null;
    }).filter((x): x is number => x !== null);
    const year = new Date(nowMs).getFullYear();
    const open = f.transfers.filter(t => !['Completed', 'Cancelled', 'Rejected'].includes(t.state));
    const alerts = computeAlerts(s, nowMs).filter(a => isWithin(a.nodeId, filters.node) || a.nodeId === 'RW' && filters.node === 'RW');
    const live = f.animals.filter(a => !exitedStatuses.includes(a.status));
    const health = { Good: 0, Watch: 0, 'At Risk': 0 };
    live.filter(a => a.holder.kind === 'household').forEach(a => { health[healthIndex(s, a, nowMs).status]++; });
    const served = f.households.filter(h => hasEverReceived(s, h.id));
    const heldNow = f.households.filter(h => holdsAny(s, h.id));
    const visited = heldNow.filter(h => s.visits.some(v => v.householdId === h.id && daysBetween(v.date, nowMs) <= s.config.visitIntervalDays));
    return {
        served: served.length, held: heldNow.length, animalsInCirculation: live.length, calvingsThisYear: f.calvings.filter(c => new Date(c.date).getFullYear() === year).length,
        passOnRate: due.length ? Math.round((confirmedOnTime / due.length) * 100) : 0, passOnDue: due.length, passOnOverdue: due.filter(t => t.column !== 'Confirmed' && t.severity !== 'ok').length,
        passOnNext30: tasks.filter(t => !t.due && t.daysUntilDue <= 30).length, closedChains: f.animals.filter(a => a.status === 'Closed Chain').length,
        avgSelectionDays: Math.round(mean(selectionDays)), exitsByReason: (['death', 'loss', 'cull'] as const).map(k => ({ reason: k, n: f.exits.filter(e => e.category === k && e.state === 'Verified').length })),
        exitRate: f.animals.length ? Math.round((f.exits.filter(e => e.state === 'Verified').length / f.animals.length) * 1000) / 10 : 0,
        approvalsWaiting: open.filter(t => t.state === 'Submitted' || t.state === 'Pending Next Approval').length, inTransit: open.filter(t => t.state === 'Dispatched').length,
        receiptsOverdue: alerts.filter(a => a.rule === 'Receipt overdue').length, exitsToVerify: f.exits.filter(e => e.state === 'Pending Verification').length,
        pipeline: ['Draft', 'Submitted', 'Pending Next Approval', 'Approved', 'Dispatched', 'Received', 'Completed'].map(state => ({ state, n: f.transfers.filter(t => t.state === state).length })),
        health, visitCoverage: heldNow.length ? Math.round((visited.length / heldNow.length) * 100) : 100,
        awaitingAssessment: f.households.filter(h => h.status === 'Registered' || h.status === 'Needs Review').length,
        target: targetProgress(s, filters.node, nowMs), alerts, tasks,
        stages: stageDurations(completed), trend: monthlyTrend(f, 12, nowMs),
        grievanceEscalations: s.grievances.filter(g => g.status !== 'Closed' && isWithin(g.nodeId, filters.node) && daysBetween(g.raisedOn, nowMs) > 30).length,
        grievanceOpen: s.grievances.filter(g => g.status !== 'Closed' && isWithin(g.nodeId, filters.node)).length,
    };
}

export function childRows(s: Store, data: Visible, filters: Filters, nowMs = Date.now()) {
    return childrenOf(filters.node).map(c => {
        const cf = { ...filters, node: c.id };
        const f = applyFilters(s, data, cf);
        const tasks = passOnTasks(s, nowMs).filter(t => isWithin(t.holder.nodeId, c.id));
        const tp = targetProgress(s, c.id, nowMs);
        return {
            id: c.id, name: c.name, level: c.level, households: f.households.length, served: f.households.filter(h => hasEverReceived(s, h.id)).length, animals: f.animals.length,
            completed: f.transfers.filter(t => t.state === 'Completed').length, open: f.transfers.filter(t => !['Completed', 'Cancelled', 'Rejected'].includes(t.state)).length,
            overdue: tasks.filter(t => t.column !== 'Confirmed' && t.severity !== 'ok').length, targetPct: tp.target ? tp.pct : null, target: tp.target, achieved: tp.achieved,
            hasData: f.households.length + f.animals.length + f.transfers.length > 0,
        };
    });
}
export const nodeName = (id: string) => nodeMap[id]?.name ?? id;

// ---------- Map (REQ-40) ----------
export type MapLayer = 'holders' | 'transfers' | 'calvings' | 'exits' | 'passon';
export interface MapPoint { id: string; name: string; level: string; lat: number; lon: number; value: number; severity: 'ok' | 'warn' | 'bad'; lines: string[]; tags: string[] }
export const mapLayers: { key: MapLayer; label: string }[] = [
    { key: 'holders', label: 'Animals held' }, { key: 'transfers', label: 'Transfers in progress' }, { key: 'calvings', label: 'Calvings' }, { key: 'exits', label: 'Exits' }, { key: 'passon', label: 'Pass-on status' },
];
/** One marker per node. Markers carry counts and animal tags only: no household names or contact details (REQ-40). */
export function mapPoints(s: Store, data: Visible, filters: Filters, layer: MapLayer, nodeIds: string[], nowMs = Date.now()): MapPoint[] {
    const tasks = passOnTasks(s, nowMs);
    const criticals = computeAlerts(s, nowMs).filter(a => a.severity === 'critical');
    return nodeIds.map(id => {
        const n = nodeMap[id];
        const f = applyFilters(s, data, { ...filters, node: id });
        const live = f.animals.filter(a => !exitedStatuses.includes(a.status));
        const open = f.transfers.filter(t => !['Completed', 'Cancelled', 'Rejected'].includes(t.state));
        const nodeTasks = tasks.filter(t => isWithin(t.holder.nodeId, id) && t.column !== 'Confirmed' && (t.due || t.daysUntilDue <= 30));
        const overdue = nodeTasks.filter(t => t.severity !== 'ok');
        const verified = f.exits.filter(e => e.state === 'Verified');
        const alerts = criticals.filter(a => isWithin(a.nodeId, id)).length;
        let value = 0; let severity: MapPoint['severity'] = 'ok'; let tags: string[] = [];
        if (layer === 'holders') { value = live.length; tags = live.slice(0, 12).map(a => a.tag); severity = alerts ? 'bad' : 'ok'; }
        if (layer === 'transfers') { value = open.length; severity = open.some(t => t.state === 'Disputed') ? 'bad' : open.some(t => t.state === 'Dispatched') ? 'warn' : 'ok'; tags = open.slice(0, 12).map(t => t.id); }
        if (layer === 'calvings') { value = f.calvings.length; }
        if (layer === 'exits') { value = verified.length + f.exits.filter(e => e.state === 'Pending Verification').length; severity = f.exits.some(e => e.state === 'Pending Verification') ? 'warn' : 'ok'; }
        if (layer === 'passon') { value = nodeTasks.length; severity = overdue.some(t => t.severity === 'red') ? 'bad' : overdue.length ? 'warn' : 'ok'; tags = nodeTasks.slice(0, 12).map(t => s.animals.find(a => a.id === t.calfId)?.tag ?? t.calfId); }
        return { id, name: n.name, level: n.level, lat: n.lat, lon: n.lon, value, severity, tags, lines: [`${live.length} animals · ${f.households.length} households`, `${open.length} transfers in progress · ${overdue.length} pass-ons overdue`, `${f.calvings.length} calvings · ${verified.length} exits`] };
    });
}
