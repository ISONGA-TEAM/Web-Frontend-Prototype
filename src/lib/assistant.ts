// Mock AI assistant (REQ-44, REQ-45). There is NO language model here: answers are templates filled with
// figures computed from the user's own jurisdiction, in Kinyarwanda or English. That makes every figure
// traceable to a named query, and lets the interface be tested before TBD-8 (model hosting) is decided.
import { applyFilters, emptyFilters, nodeName, summary } from './metrics';
import type { Visible } from './scope';
import { alertsFor, can } from './rules';
import { fieldNotes, themes } from '../data/mockNotes';
import { isWithin } from '../data/hierarchy';
import type { Store, User } from '../types';

export type Lang = 'rw' | 'en';
export interface Source { id: string; label: string; value: string | number; link?: string }
export interface Answer { text: string; sources: Source[]; intent: string }

/** Personal identifiers are removed before any text would be sent to a model (REQ-44). */
export function scrub(text: string, store: Pick<Store, 'households'>): string {
    let out = text.replace(/\b\d{16}\b/g, '[ID]').replace(/\b0?7[2389]\d{7}\b/g, '[PHONE]');
    for (const h of store.households) {
        const parts = h.headName.split(/\s+/).filter(p => p.length > 2);
        for (const p of parts) out = out.replace(new RegExp(`\\b${p}\\b`, 'gi'), '[IZINA]');
    }
    return out;
}

const T = {
    passon: { rw: 'Mu {node}, inyana {due} zigeze igihe cyo gutangwa kandi {overdue} muri zo zararengeje igihe. Izindi {next} zizagera igihe mu minsi 30 iri imbere. Ijanisha ry’izatanzwe ku gihe ni {rate}%.', en: 'In {node}, {due} calves have reached pass-on age and {overdue} of them are overdue. {next} more reach it within 30 days. On-time completion is {rate}%.' },
    approvals: { rw: 'Mu {node} hari ibyemezwa {n} bitegereje. Muri byo {mine} bigutegereje wowe.', en: 'In {node}, {n} transfers are waiting for approval; {mine} are waiting for you.' },
    alerts: { rw: 'Hari imenyesha {n} rifunguye mu {node}; {critical} muri ryo ni iby’ihutirwa.', en: 'There are {n} open alerts in {node}; {critical} are critical.' },
    target: { rw: 'Imihigo y’umwaka {year} mu {node}: hamaze kugerwaho {a} kuri {t} ({pct}%). Ikigereranyo cy’impera z’umwaka ni {p} (ni igereranya, si igisubizo cyizewe).', en: 'Imihigo {year} in {node}: {a} of {t} achieved ({pct}%). The end-of-year projection is {p} (an estimate, not a result).' },
    health: { rw: 'Inka {risk} ziri mu kaga kandi {watch} zigomba gukurikiranwa mu {node}. Impamvu za buri imwe ziboneka ku rupapuro rwayo.', en: 'In {node}, {risk} animals are at risk and {watch} are on watch. The rule behind each flag is on the animal’s page.' },
    animals: { rw: 'Mu {node} hari inka {n} zikiriho; {held} imiryango ifite inka none, {served} imaze guhabwa inka.', en: 'In {node} there are {n} live animals; {held} households hold an animal now and {served} have been served.' },
    notes: { rw: 'Nasomye inyandiko {n} z’abakozi bo mu midugudu. Ingingo zigaruka cyane: {themes}.', en: 'I read {n} field notes from village agents. The most frequent themes: {themes}.' },
    help: { rw: 'Nshobora gusubiza ku: gutanga inyana, ibyemezwa, imenyesha, imihigo, ubuzima bw’inka, umubare w’inka, n’inyandiko z’abakozi bo mu midugudu. Gerageza kimwe muri ibyo.', en: 'I can answer about: pass-ons, approvals, alerts, Imihigo, animal health, animal counts and village field notes. Try one of those.' },
} as const;
const fill = (tpl: string, v: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

const intents: { key: keyof typeof T; words: string[] }[] = [
    { key: 'passon', words: ['gutanga', 'inyana', 'pass', 'calf', 'calves'] },
    { key: 'approvals', words: ['kwemeza', 'byemezwa', 'approv', 'waiting'] },
    { key: 'alerts', words: ['imenyesha', 'alert', 'ihutirwa', 'critical'] },
    { key: 'target', words: ['imihigo', 'intego', 'target', 'quota'] },
    { key: 'health', words: ['ubuzima', 'indwara', 'health', 'risk', 'kaga'] },
    { key: 'notes', words: ['inyandiko', 'abakozi', 'notes', 'field', 'ibibazo'] },
    { key: 'animals', words: ['inka', 'umubare', 'animals', 'cattle', 'count', 'umuryango', 'households'] },
];
export const suggestions: Record<Lang, string[]> = {
    rw: ['Inyana zigeze igihe cyo gutangwa ni zingahe?', 'Ni ibihe byemezwa bintegereje?', 'Hari imenyesha ry’ihutirwa?', 'Imihigo igeze he?', 'Ubuzima bw’inka bumeze bute?', 'Mpa incamake y’inyandiko z’abakozi bo mu midugudu'],
    en: ['How many calves are due for pass-on?', 'What is waiting for my approval?', 'Are there critical alerts?', 'How is Imihigo progress?', 'How is animal health?', 'Summarise the village field notes'],
};

export function answer(store: Store, user: User, data: Visible, question: string, lang: Lang, mineApprovals: number, nowMs = Date.now()): Answer {
    const q = question.toLowerCase();
    const hit = intents.find(i => i.words.some(w => q.includes(w)));
    const f = emptyFilters(user.nodeId);
    const m = summary(store, applyFilters(store, data, f), f, nowMs);
    const node = nodeName(user.nodeId);
    const key = hit?.key ?? 'help';
    const src = (id: string, label: string, value: string | number, link?: string): Source => ({ id, label, value, link });
    let vars: Record<string, string | number> = { node };
    let sources: Source[] = [];
    switch (key) {
        case 'passon': vars = { node, due: m.passOnDue, overdue: m.passOnOverdue, next: m.passOnNext30, rate: m.passOnRate }; sources = [src('Q-PASSON-DUE', 'Pass-on tasks at or past eligible age', m.passOnDue, '/pass-on'), src('Q-PASSON-OVERDUE', 'Open longer than the amber threshold', m.passOnOverdue, '/pass-on'), src('Q-PASSON-30D', 'Reaching pass-on age within 30 days', m.passOnNext30), src('Q-PASSON-RATE', 'Confirmed within threshold ÷ due (%)', m.passOnRate)]; break;
        case 'approvals': vars = { node, n: m.approvalsWaiting, mine: mineApprovals }; sources = [src('Q-APPR-WAITING', 'Transfers in Submitted or Pending Next Approval', m.approvalsWaiting, '/approvals'), src('Q-APPR-MINE', 'Waiting for your role and jurisdiction', mineApprovals, '/approvals')]; break;
        case 'alerts': { const open = alertsFor(store, user).filter(a => a.state?.status !== 'Resolved'); const crit = open.filter(a => a.severity === 'critical').length; vars = { node, n: open.length, critical: crit }; sources = [src('Q-ALERT-OPEN', 'Alerts not resolved', open.length, '/alerts'), src('Q-ALERT-CRIT', 'Of which critical', crit, '/alerts')]; break; }
        case 'target': vars = { node, year: new Date(nowMs).getFullYear(), a: m.target.achieved, t: m.target.target, pct: m.target.pct, p: m.target.projected }; sources = [src('Q-TARGET', 'Approved quota record', m.target.target, '/reports'), src('Q-ACHIEVED', 'Completed primary, pass-on and replacement transfers this year', m.target.achieved), src('Q-PROJECTED', m.target.method, m.target.projected)]; break;
        case 'health': vars = { node, risk: m.health['At Risk'], watch: m.health.Watch }; sources = [src('Q-HEALTH-RISK', 'Health index At Risk', m.health['At Risk'], '/animals'), src('Q-HEALTH-WATCH', 'Health index Watch', m.health.Watch, '/animals')]; break;
        case 'animals': vars = { node, n: m.animalsInCirculation, held: m.held, served: m.served }; sources = [src('Q-ANIMALS-LIVE', 'Animals not exited', m.animalsInCirculation, '/animals'), src('Q-HH-HELD', 'Households holding an animal', m.held, '/households'), src('Q-HH-SERVED', 'Households that ever received one', m.served)]; break;
        case 'notes': { const sum = summariseNotes(user, lang); vars = { n: sum.count, themes: sum.themes.map(t => `${t.label} (${t.n})`).join('; ') || (lang === 'rw' ? 'nta zihari' : 'none') }; sources = sum.themes.map(t => src(`Q-NOTES-${t.key.toUpperCase()}`, t.label, t.n)); break; }
        default: break;
    }
    return { text: fill(T[key][lang], vars), sources, intent: key };
}

export function summariseNotes(user: User, lang: Lang) {
    const notes = fieldNotes.filter(n => isWithin(n.villageId, user.nodeId));
    const counts = themes.map(t => ({ key: t.key, label: lang === 'rw' ? t.rw : t.en, n: notes.filter(n => t.words.some(w => n.text.toLowerCase().includes(w))).length })).filter(t => t.n > 0).sort((a, b) => b.n - a.n);
    return { count: notes.length, themes: counts, notes };
}

// ---------- Report drafting ----------
export type ReportKind = 'weekly_sector' | 'monthly_district' | 'quarterly_province' | 'annual_national';
export const reportKinds: { kind: ReportKind; rw: string; en: string; roles: User['role'][] }[] = [
    { kind: 'weekly_sector', rw: 'Raporo y’icyumweru y’Umurenge', en: 'Weekly sector summary', roles: ['sector_officer', 'cell_officer'] },
    { kind: 'monthly_district', rw: 'Raporo y’ukwezi y’Akarere', en: 'Monthly district report', roles: ['district_coordinator'] },
    { kind: 'quarterly_province', rw: 'Raporo y’igihembwe y’Intara', en: 'Quarterly provincial report', roles: ['provincial_officer'] },
    { kind: 'annual_national', rw: 'Raporo y’umwaka y’igihugu', en: 'Annual national report', roles: ['national_officer', 'auditor'] },
];
export interface Draft { kind: ReportKind; lang: Lang; paragraphs: { text: string; sources: Source[] }[]; generatedAt: string }

export function draftReport(store: Store, user: User, data: Visible, kind: ReportKind, lang: Lang, mineApprovals: number, nowMs = Date.now()): Draft {
    const mk = (q: string) => answer(store, user, data, q, lang, mineApprovals, nowMs);
    const intro = lang === 'rw'
        ? `${reportKinds.find(r => r.kind === kind)![lang]} — ${nodeName(user.nodeId)}. Iyi raporo yakozwe n’umufasha w’icyitegererezo ku wa ${new Date(nowMs).toLocaleDateString('en-GB')} ishingiye ku makuru ari muri sisitemu gusa.`
        : `${reportKinds.find(r => r.kind === kind)![lang]}: ${nodeName(user.nodeId)}. Drafted by the mock assistant on ${new Date(nowMs).toLocaleDateString('en-GB')} from recorded data only.`;
    const parts = [mk('animals'), mk('target'), mk('passon'), mk('approvals'), mk('health'), mk('alerts')];
    if (can(user, 'record_event')) parts.push(mk('notes'));
    return { kind, lang, generatedAt: new Date(nowMs).toISOString(), paragraphs: [{ text: intro, sources: [] }, ...parts.map(p => ({ text: p.text, sources: p.sources }))] };
}
