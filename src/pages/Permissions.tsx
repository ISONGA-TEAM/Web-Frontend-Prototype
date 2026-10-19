import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Errors, fmtDateTime } from '../components/ui';
import * as E from '../lib/engine';
import { allActions, lockedActions, permissionsOf, roleTemplate } from '../lib/rules';
import type { Action, RuleError } from '../lib/rules';
import { appRouteTable } from '../routes';
import { nodeMap } from '../data/hierarchy';
import type { Role } from '../types';

type Tab = 'pages' | 'widgets' | 'actions';
const info: Record<string, [string, string]> = {
    page_households: ['Households', 'Household list and profiles'], page_selection: ['Selection lists', 'Village to district nomination chain'], page_animals: ['Cattle registry', 'Animal records and chain of custody'],
    page_transfers: ['Transfers', 'Request, track and complete transfers'], page_approvals: ['Approval queue', 'Transfers waiting for a decision'], page_passon: ['Pass-on board', 'First female calf tracking'],
    page_alerts: ['Alerts', 'Threshold alerts and their status'], page_reports: ['Reports and Imihigo', 'Targets, progress and standard reports'], page_grievances: ['Grievances', 'Household complaints'],
    page_assistant: ['Assistant', 'Kinyarwanda and English assistant'], page_admin: ['Administration', 'Thresholds, hierarchy, staff list'], page_audit: ['Audit trail', 'Search every recorded action'],
    widget_kpis: ['Key figures', 'Headline numbers for the jurisdiction'], widget_map: ['Map', 'Clickable map with layers'], widget_children: ['Drill-down', 'Table and chart by area below'], widget_imihigo: ['Imihigo progress', 'Target, achieved, projection'],
    widget_pipeline: ['Transfer pipeline', 'Transfers by state'], widget_trend: ['Monthly trend', 'Transfers, calvings, exits'], widget_stages: ['Days per stage', 'Mean and median'], widget_health: ['Health index', 'Animals good, watch, at risk'],
    widget_approvals: ['Waiting for me', 'My pending approvals'], widget_alerts: ['Alerts', 'Latest alerts'], widget_worklist: ['My worklist', 'Receipts, pass-ons, vaccinations'], widget_calving_calendar: ['Calving calendar', 'Next 30 days, estimates'],
    widget_to_visit: ['Households to visit', 'No visit recently'], widget_my_status: ['My eligibility', 'Eligibility and grievances (household accounts)'], widget_my_actions: ['Needs my action', 'Receipts and signatures (household accounts)'],
    widget_my_animals: ['My animals', 'Animals and next vaccination (household accounts)'], widget_my_transfers: ['My transfers', 'Transfer status (household accounts)'],
    nominate_household: ['Register and nominate households', 'Create household records and lists'], assess: ['Assess eligibility', 'Record eligibility assessments'], approve_list: ['Move selection lists', 'Advance or return lists'],
    create_transfer: ['Create transfers', 'Start and submit requests'], approve_transfer: ['Approve transfers', 'Only at the level matching their role'], confirm_receipt: ['Dispatch, receive, acknowledge', 'Field steps of a transfer'],
    record_event: ['Record events', 'Calvings, health, visits, exits'], close_reverse: ['Reverse and close', 'Reverse transfers, close chains'], export: ['Export data', 'CSV, XLSX and printable view'], view_audit: ['Read the audit trail', 'Search the log'],
    register_animal: ['Register animals', 'Add animals to the district store'], verify_exit: ['Verify exits', 'Confirm deaths and losses'], configure: ['Change thresholds', 'Rules set by MINALOC'], raise_grievance: ['Raise grievances', 'Households only'],
    handle_grievance: ['Handle grievances', 'Acknowledge and close'], manage_targets: ['Set quotas', 'Imihigo quota records'],
};
const tabOf = (a: string): Tab => a.startsWith('page_') ? 'pages' : a.startsWith('widget_') ? 'widgets' : 'actions';
const nameOf = (a: string) => info[a]?.[0] ?? a.replaceAll('_', ' ');

/** The System Administrator gives and takes away permissions. Changes are staged, previewed, then applied with one reason. */
export default function Permissions() {
    const { user } = useAuth();
    const { store, act } = useStore();
    const { t } = useTranslation();
    const [q, setQ] = useState(''); const [role, setRole] = useState('');
    const [selected, setSelected] = useState(store.users.find(u => u.id === 'U-agent-BIG-1-1')?.id ?? store.users[0].id);
    const [tab, setTab] = useState<Tab>('widgets');
    const [staged, setStaged] = useState<Record<string, boolean>>({});
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [notice, setNotice] = useState('');
    const target = store.users.find(u => u.id === selected)!;
    const current = useMemo(() => permissionsOf(target, store.grants), [target, store.grants]);
    const base = roleTemplate(target.role) as string[];
    const g = store.grants[target.id];
    const users = store.users.filter(u => (!role || u.role === role) && `${u.name} ${u.username}`.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
    const roles = [...new Set(store.users.map(u => u.role))] as Role[];
    const isSelf = target.id === user!.id;
    const want = (a: string) => staged[a] ?? current.includes(a as Action);
    const pending = Object.keys(staged);
    const source = (a: string) => g?.granted.includes(a as Action) ? 'granted' : g?.revoked.includes(a as Action) ? 'revoked' : base.includes(a) ? 'role default' : 'not given';
    const pick = (id: string) => { setSelected(id); setStaged({}); setErrors([]); setNotice(''); setReason(''); };
    const toggle = (a: string) => { if (isSelf) return; const next = !want(a); const copy = { ...staged }; if (next === current.includes(a as Action)) delete copy[a]; else copy[a] = next; setStaged(copy); setNotice(''); };

    const seesPages = appRouteTable.filter(r => r.nav && want(r.needs)).map(r => r.nav!);
    const nowPages = appRouteTable.filter(r => r.nav && current.includes(r.needs)).map(r => r.nav!);
    const widgets = allActions.filter(a => a.startsWith('widget_'));
    const chip = (key: string, label: string, was: boolean, will: boolean) => <span key={key} className={`perm-chip ${will && !was ? 'add' : !will && was ? 'remove' : will ? 'on' : 'off'}`}>{will && !was ? '+ ' : !will && was ? '− ' : ''}{label}</span>;

    const apply = () => {
        if (!reason.trim()) { setErrors([{ rule: 'reason', field: 'reason', message: 'Record why you are changing these permissions.' }]); return; }
        for (const a of pending) {
            const r = act((s, u) => E.setPermission(s, u, target.id, a as Action, staged[a] ? 'grant' : 'revoke', reason));
            if (!r.ok) { setErrors(r.errors); return; }
        }
        setErrors([]); setStaged({}); setReason(''); setNotice(`${pending.length} change${pending.length === 1 ? '' : 's'} applied to ${target.name}. Each one is in the audit trail and can be reversed.`);
    };
    const reset = () => {
        if (!reason.trim()) { setErrors([{ rule: 'reason', field: 'reason', message: 'Record why you are resetting this user.' }]); return; }
        const r = act((s, u) => E.resetPermissions(s, u, target.id, reason));
        if (!r.ok) setErrors(r.errors); else { setErrors([]); setStaged({}); setReason(''); setNotice(`${target.name} is back to the ${t(`roles.${target.role}`)} defaults.`); }
    };
    const history = store.audit.filter(a => a.action.startsWith('permission.') && a.recordId === target.id).slice(-5).reverse();
    const list = allActions.filter(a => tabOf(a) === tab);
    const count = (tb: Tab) => allActions.filter(a => tabOf(a) === tb && want(a)).length;
    const tabs: [Tab, string][] = [['widgets', 'Dashboard widgets'], ['pages', 'Pages'], ['actions', 'Actions']];

    return <div className="perm-page">
        <header className="page-head"><div><h1>{t('nav.permissions')}</h1><p>Choose a person, switch features on or off, check the preview, then apply with one reason. Every change is audited and can be reversed at any time.</p></div></header>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <div className="perm-layout">
            <aside className="perm-users panel" aria-label="Users">
                <div className="perm-search"><Search size={14} aria-hidden="true" /><input aria-label="Search users" placeholder={t('common.search')} value={q} onChange={e => setQ(e.target.value)} /></div>
                <select aria-label="Filter by role" value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option>{roles.map(r => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}</select>
                <ul>{users.map(u => <li key={u.id}><button aria-pressed={u.id === selected} className={u.id === selected ? 'sel' : ''} onClick={() => pick(u.id)}>
                    <span className="avatar">{u.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</span>
                    <span><b>{u.name}</b><small>{t(`roles.${u.role}`)} · {nodeMap[u.nodeId]?.name}</small></span>
                    {store.grants[u.id] && <i className="dot" title="Customised" aria-label="Customised" />}
                </button></li>)}</ul>
            </aside>

            <main className="perm-main">
                <section className="panel perm-head">
                    <div><h2>{target.name}</h2><p>{t(`roles.${target.role}`)} · {nodeMap[target.nodeId]?.name} · <code>{target.username}</code></p></div>
                    <div className="perm-summary">{g ? <><Badge state="Needs Review" label={`customised: +${g.granted.length} −${g.revoked.length}`} /></> : <Badge state="ok" label="role defaults" />}</div>
                </section>
                {isSelf && <p className="form-warn">You cannot change your own permissions.</p>}

                <section className="panel perm-preview" aria-live="polite">
                    <h3><ShieldCheck size={14} aria-hidden="true" /> What {target.name.split(' ')[0]} will see</h3>
                    <p className="perm-label">Menu</p>
                    <div className="perm-chips">{[...new Set([...nowPages, ...seesPages])].map(k => chip(k, t(`nav.${k}`), nowPages.includes(k), seesPages.includes(k)))}</div>
                    <p className="perm-label">Dashboard</p>
                    <div className="perm-chips">{widgets.filter(w => current.includes(w) || want(w)).map(w => chip(w, nameOf(w), current.includes(w), want(w)))}{!widgets.some(w => want(w)) && <span className="perm-chip off">Empty dashboard</span>}</div>
                    {pending.length > 0 && <p className="perm-legend"><span className="perm-chip add">+ new</span> <span className="perm-chip remove">− removed</span> not saved yet</p>}
                </section>

                <section className="panel">
                    <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l} <small>{count(k)}/{allActions.filter(a => tabOf(a) === k).length}</small></button>)}</div>
                    <div className="perm-grid">{list.map(a => {
                        const on = want(a); const changed = a in staged; const src = changed ? 'pending' : source(a);
                        return <label key={a} className={`perm-card ${on ? 'on' : ''} ${changed ? 'changed' : ''} ${isSelf ? 'disabled' : ''}`}>
                            <span className="perm-text"><b>{nameOf(a)}</b><small>{info[a]?.[1] ?? ''}</small><em className={`src src-${src.replace(' ', '-')}`}>{src}</em></span>
                            <input type="checkbox" role="switch" className="switch" checked={on} disabled={isSelf} onChange={() => toggle(a)} aria-label={nameOf(a)} />
                        </label>;
                    })}</div>
                    <p className="registry-demo-note"><Lock size={12} aria-hidden="true" /> Fixed by the SRS and not switchable: {lockedActions.map(a => a.replaceAll('_', ' ')).join(', ')}. Approval stays tied to the role at each level. A permission never widens someone’s jurisdiction.</p>
                </section>

                <section className="panel perm-history"><h3>Recent changes</h3>{history.map(h => <p key={h.id}><span>{fmtDateTime(h.ts)}</span> · <b>{h.action.replace('permission.', '')}</b> · {h.detail}</p>)}{!history.length && <p className="registry-demo-note">No changes yet.</p>}</section>
            </main>
        </div>

        {(pending.length > 0 || g) && !isSelf && <div className="apply-bar" role="region" aria-label="Apply changes">
            <div className="apply-info"><b>{pending.length ? `${pending.length} unsaved change${pending.length === 1 ? '' : 's'}` : 'Customised user'}</b><small>for {target.name}</small></div>
            <input className="srs-input" aria-label="Reason for the change" placeholder="Reason (recorded in the audit trail)" value={reason} onChange={e => { setReason(e.target.value); setErrors([]); }} />
            {pending.length > 0 && <button className="workspace-button" onClick={() => { setStaged({}); setErrors([]); }}>Discard</button>}
            {g && <button className="workspace-button" onClick={reset}><RotateCcw size={13} />Reset to role defaults</button>}
            {pending.length > 0 && <button className="workspace-button green" onClick={apply}>Apply {pending.length}</button>}
            {errors.length > 0 && <div className="apply-errors"><Errors errors={errors} /></div>}
        </div>}
    </div>;
}
