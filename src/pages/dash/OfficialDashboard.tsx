import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bookmark, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import WorkspaceDialog from '../../components/WorkspaceDialog';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Badge, Crumbs, ExportButton, Kpi, PageHead, Panel } from '../../components/ui';
import { childRows, applyFilters, emptyFilters, mapLayers, mapPoints, nodeName, summary } from '../../lib/metrics';
import type { MapLayer } from '../../lib/metrics';
import GirinkaMap from '../../components/GirinkaMap';
import type { Filters } from '../../lib/metrics';
import { approvalDenial, can } from '../../lib/rules';
import type { Action } from '../../lib/rules';
import * as E from '../../lib/engine';
import { childrenOf, descendantsOf, isWithin, levels, nextLevel, nodeMap, pathOf } from '../../data/hierarchy';
import type { Level } from '../../data/hierarchy';
import { transferTypes } from '../../lib/rules';
import type { AnimalStatus } from '../../types';

const animalStatuses: AnimalStatus[] = ['In District Store', 'Allocated (In Transit)', 'With Holder', 'Pregnant', 'Lactating', 'Deceased', 'Lost', 'Culled', 'Closed Chain'];
const green = '#00643b'; const blue = '#195bff'; const amber = '#e5a50a';

export default function OfficialDashboard() {
    const { user } = useAuth();
    const { store, data, asOf, refresh, act } = useStore();
    const { t, i18n } = useTranslation();
    const [sp, setSp] = useSearchParams();
    const nav = useNavigate();
    const [more, setMore] = useState(false);
    const [viewsOpen, setViewsOpen] = useState(false);
    const [viewName, setViewName] = useState('');
    const [shareView, setShareView] = useState(false);
    const [viewMsg, setViewMsg] = useState('');
    const [layer, setLayer] = useState<MapLayer>('holders');
    const [resetNote, setResetNote] = useState('');
    const [tick, setTick] = useState(0);
    useEffect(() => { const id = setInterval(() => setTick(x => x + 1), 30_000); const r = setInterval(refresh, 300_000); return () => { clearInterval(id); clearInterval(r); }; }, [refresh]);
    const root = user!.nodeId;
    const rootLevel = nodeMap[root].level;
    const paramNode = sp.get('node');
    const f: Filters = { ...emptyFilters(paramNode && nodeMap[paramNode] && isWithin(paramNode, root) ? paramNode : root), from: sp.get('from') ?? '', to: sp.get('to') ?? '', astatus: sp.get('astatus') ?? '', breed: sp.get('breed') ?? '', ttype: sp.get('ttype') ?? '', sex: sp.get('sex') ?? '' };
    const setF = (patch: Partial<Filters>) => {
        const next = { ...f, ...patch }; const q = new URLSearchParams();
        if (next.node !== root) q.set('node', next.node);
        (['from', 'to', 'astatus', 'breed', 'ttype', 'sex'] as const).forEach(k => { if (next[k]) q.set(k, next[k]); });
        setSp(q, { replace: true });
    };
    const filtered = useMemo(() => applyFilters(store, data, f), [store, data, f.node, f.from, f.to, f.astatus, f.breed, f.ttype, f.sex]); // eslint-disable-line react-hooks/exhaustive-deps
    const m = useMemo(() => summary(store, filtered, f, asOf), [store, filtered, asOf, f.node]); // eslint-disable-line react-hooks/exhaustive-deps
    const rows = useMemo(() => childRows(store, data, f, asOf), [store, data, asOf, f.node, f.from, f.to, f.astatus, f.breed, f.ttype, f.sex]); // eslint-disable-line react-hooks/exhaustive-deps
    const level = nodeMap[f.node].level;
    // One experience for everyone: every widget appears only if the user's effective permissions include its page.
    const has = (a: Action) => can(user, a);
    const pageOf: Record<string, Action> = { '/households': 'page_households', '/animals': 'page_animals', '/transfers': 'page_transfers', '/approvals': 'page_approvals', '/pass-on': 'page_passon', '/alerts': 'page_alerts', '/reports': 'page_reports', '/grievances': 'page_grievances' };
    const layerNeeds: Record<MapLayer, Action> = { holders: 'page_animals', calvings: 'page_animals', exits: 'page_animals', transfers: 'page_transfers', passon: 'page_passon' };
    const layers = has('widget_map') ? mapLayers.filter(l => has(layerNeeds[l.key])) : [];
    const activeLayer = layers.some(l => l.key === layer) ? layer : layers[0]?.key;
    const child = nextLevel(level);
    const minutes = Math.max(0, Math.round((Date.now() - asOf) / 60000)) + 0 * tick;
    const breeds = [...new Set(store.animals.map(a => a.breed))];
    const mine = data.transfers.filter(tr => approvalDenial(user!, tr) === null);
    const dashKey = level === 'national' ? 'national' : level;
    // Saved views: mine, plus views shared by users whose jurisdiction contains mine. A view pointing outside my jurisdiction opens at my own node.
    const myViews = store.savedViews.filter(v => v.ownerId === user!.id);
    const sharedViews = store.savedViews.filter(v => v.shared && v.ownerId !== user!.id && isWithin(user!.nodeId, v.ownerNodeId));
    const saveCurrent = () => { const q = sp.toString(); const r = act((s, u) => E.saveView(s, u, viewName, q, activeLayer ?? layer, shareView)); setViewMsg(r.ok ? `Saved “${viewName.trim()}”.` : r.errors.map(e => e.message).join(' ')); if (r.ok) setViewName(''); };
    const openView = (v: { query: string; layer: string }) => { setSp(new URLSearchParams(v.query), { replace: true }); if (mapLayers.some(l => l.key === v.layer)) setLayer(v.layer as MapLayer); };
    const chips = ([
        f.node !== root && { k: 'node', label: `Area: ${nodeName(f.node)}` }, f.from && { k: 'from', label: `From ${f.from}` }, f.to && { k: 'to', label: `To ${f.to}` },
        f.astatus && { k: 'astatus', label: `Status: ${t(`state.${f.astatus}`)}` }, f.breed && { k: 'breed', label: `Breed: ${f.breed}` }, f.ttype && { k: 'ttype', label: `Type: ${t(`type.${f.ttype}`)}` }, f.sex && { k: 'sex', label: `Calf sex: ${f.sex}` },
    ].filter(Boolean)) as { k: string; label: string }[];
    const activeMore = [f.astatus, f.breed, f.ttype, f.sex].filter(Boolean).length;
    const drill = (id: string, lv: string) => { setResetNote(''); if (lv === 'village') nav(`/households?village=${id}`); else setF({ node: id }); };
    const nodeIds = child ? childrenOf(f.node).map(c => c.id) : [f.node];
    const villageIds = descendantsOf(f.node, 'village').map(v => v.id);
    const points = useMemo(() => activeLayer ? mapPoints(store, data, f, activeLayer, nodeIds, asOf) : [], [store, data, asOf, activeLayer, f.node, f.from, f.to, f.astatus, f.breed, f.ttype, f.sex]); // eslint-disable-line react-hooks/exhaustive-deps
    const villagePoints = useMemo(() => activeLayer && villageIds.length && villageIds.length <= 60 && level !== 'village' ? mapPoints(store, data, f, activeLayer, villageIds, asOf) : [], [store, data, asOf, activeLayer, f.node, f.from, f.to, f.astatus, f.breed, f.ttype, f.sex]); // eslint-disable-line react-hooks/exhaustive-deps
    const fromBar = (d: unknown) => (d as { payload?: Record<string, unknown> })?.payload ?? (d as Record<string, unknown>);
    const clickPipeline = (d: unknown) => { const state = fromBar(d).state; if (typeof state === 'string') nav(`/transfers?state=${encodeURIComponent(state)}`); };
    const clickChild = (d: unknown) => { const r = fromBar(d); if (typeof r.id === 'string') drill(r.id, String(r.level)); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dotClick = (kind: 'transfers' | 'calvings' | 'exits') => (...a: any[]) => {
        const month: string | undefined = a[0]?.payload?.month ?? a[1]?.payload?.month;
        if (!month) return;
        nav(kind === 'transfers' ? `/transfers?state=Completed&month=${month}` : kind === 'calvings' ? `/animals?kind=calf&born=${month}` : '/animals?status=Deceased');
    };

    const cascade = levels.slice(levels.indexOf(rootLevel) + 1).map(lv => {
        const path = pathOf(f.node);
        const selected = path.find(n => n.level === lv);
        const parent = path.find(n => n.level === levels[levels.indexOf(lv) - 1]);
        const options = parent ? childrenOf(parent.id) : [];
        return { lv, selected, parent, options };
    });
    const pick = (lv: Level, parentId: string | undefined, value: string) => {
        const hadDeeper = pathOf(f.node).some(n => levels.indexOf(n.level) > levels.indexOf(lv));
        setResetNote(hadDeeper ? 'Lower-level filters were reset because you changed a higher level (REQ-34).' : '');
        setF({ node: value || parentId || root });
    };

    const summaryText = i18n.language === 'rw'
        ? `Muri ${nodeName(f.node)}, inyana ${m.passOnNext30 + m.tasks.filter(x => x.due && x.column !== 'Confirmed').length} zigomba gutangwa (${m.passOnOverdue} zararengeje igihe). Hari ibyo kwemeza ${m.approvalsWaiting}, n'ibyakirwa byarengeje igihe ${m.receiptsOverdue}.`
        : `In ${nodeName(f.node)}, ${m.tasks.filter(x => x.due && x.column !== 'Confirmed').length} calves are due or open for pass-on and ${m.passOnNext30} more reach pass-on age within 30 days; ${m.passOnOverdue} are overdue. ${m.approvalsWaiting} transfers wait for approval and ${m.receiptsOverdue} receipts are overdue.`;

    const kpis = () => {
        const base = {
            national: [
                <Kpi key="s" label="Households served" value={m.served} note={`${m.held} hold an animal now`} to="/households" />,
                <Kpi key="a" tone="blue" label="Animals in circulation" value={m.animalsInCirculation} note="Not exited" to="/animals" />,
                <Kpi key="c" label="Calvings this year" value={m.calvingsThisYear} tone="yellow" />,
                <Kpi key="p" label="Pass-on completion rate" value={`${m.passOnRate}%`} note={`${m.passOnDue} due · on time = within ${store.config.passOnAmberDays} days`} to="/pass-on" />,
                <Kpi key="cl" tone="blue" label="Closed chains" value={m.closedChains} />,
                <Kpi key="d" label="Selection to primary transfer" value={`${m.avgSelectionDays} days`} note="Mean, list approval to handover" tone="yellow" />,
                <Kpi key="e" tone="red" label="Exit rate" value={`${m.exitRate}%`} note={m.exitsByReason.map(x => `${x.n} ${x.reason}`).join(' · ')} />,
            ],
            province: [
                <Kpi key="q" label="Quota attainment" value={`${m.target.pct}%`} note={`${m.target.achieved} of ${m.target.target}`} />,
                <Kpi key="o" tone="red" label="Overdue pass-ons" value={m.passOnOverdue} to="/pass-on" note="Amber or red" />,
                <Kpi key="s" tone="blue" label="Households served" value={m.served} />,
                <Kpi key="g" tone="yellow" label="Grievance escalations" value={m.grievanceEscalations} note={`${m.grievanceOpen} open`} to="/grievances" />,
                <Kpi key="a" label="Approvals waiting" value={m.approvalsWaiting} />,
            ],
            district: [
                <Kpi key="w" label="Approvals waiting" value={m.approvalsWaiting} to="/approvals" note={`${mine.length} for you`} />,
                <Kpi key="t" tone="blue" label="Dispatches in transit" value={m.inTransit} to="/transfers" />,
                <Kpi key="r" tone="red" label="Receipts overdue" value={m.receiptsOverdue} to="/alerts" note={`Over ${store.config.receiptHours} h`} />,
                <Kpi key="x" tone="yellow" label="Exits to verify" value={m.exitsToVerify} />,
                <Kpi key="i" label="Imihigo progress" value={`${m.target.pct}%`} note={`${m.target.achieved} of ${m.target.target}`} to="/reports" />,
            ],
            sector: [
                <Kpi key="p" label="Pending approvals" value={m.approvalsWaiting} to="/approvals" note={`${mine.length} for you`} />,
                <Kpi key="d" tone="yellow" label="Pass-ons due in 30 days" value={m.passOnNext30} to="/pass-on" />,
                <Kpi key="v" tone="blue" label="Vet visit coverage" value={`${m.visitCoverage}%`} note={`Target ${store.config.visitCoveragePct}%`} />,
                <Kpi key="h" tone="red" label="Animals at risk" value={m.health['At Risk']} note={`${m.health.Watch} on watch`} />,
                <Kpi key="e" label="Households to assess" value={m.awaitingAssessment} to="/households" />,
            ],
            cell: [
                <Kpi key="q" label="Household verification queue" value={m.awaitingAssessment} to="/households" />,
                <Kpi key="r" tone="blue" label="Receipts to confirm" value={m.inTransit} to="/transfers" />,
                <Kpi key="c" tone="yellow" label="Calvings to review" value={filtered.calvings.filter(c => Date.now() - new Date(c.date).getTime() < 30 * 86_400_000).length} note="Last 30 days" />,
                <Kpi key="d" tone="red" label="Deaths awaiting evidence" value={m.exitsToVerify} />,
            ],
        };
        const tier = user!.role === 'system_admin' || user!.role === 'auditor' || user!.role === 'national_officer' ? 'national' : (user!.role === 'provincial_officer' ? 'province' : user!.role === 'district_coordinator' ? 'district' : user!.role === 'sector_officer' ? 'sector' : 'cell');
        return base[tier].filter(el => { const to = (el.props as { to?: string }).to; return !to || !pageOf[to] || has(pageOf[to]); });
    };

    const childLabel = child ? t(`levels.${child}`) : '';
    const exportRows = [[childLabel, 'Households', 'Served', 'Animals', 'Completed transfers', 'Open transfers', 'Overdue pass-ons', 'Target %'], ...rows.map(r => [r.name, r.households, r.served, r.animals, r.completed, r.open, r.overdue, r.targetPct ?? ''].map(String))];

    return <div className="overview-page">
        <PageHead title={t(`dash.${dashKey === 'national' ? 'national' : dashKey}`)} sub={`${nodeName(f.node)} · ${t(`levels.${level}`)} · ${user!.name}`}>
            <button className="workspace-button" onClick={() => setViewsOpen(true)}><Bookmark size={14} aria-hidden="true" />Saved views{myViews.length + sharedViews.length > 0 ? ` (${myViews.length + sharedViews.length})` : ''}</button>
            <button className="workspace-button" onClick={refresh}><RefreshCw size={14} aria-hidden="true" />{t('dash.refresh')}</button>
        </PageHead>
        <p className="live-line" role="status" title="Aggregates refresh every 5 minutes. Critical alerts would arrive over a live socket in the full system."><span className="dot" aria-hidden="true" />{t('dash.dataAsOf')} {new Date(asOf).toLocaleString('en-GB')} · {t('dash.updated', { m: minutes })}</p>

        <form className="panel dash-toolbar" aria-label={t('dash.filters')} onSubmit={e => e.preventDefault()}>
            <div className="tb-row">
                <fieldset className="tb-group"><legend>Period</legend>
                    <label>From<input type="date" value={f.from} onChange={e => setF({ from: e.target.value })} /></label>
                    <label>To<input type="date" value={f.to} onChange={e => setF({ to: e.target.value })} /></label>
                </fieldset>
                <fieldset className="tb-group tb-grow"><legend>Area</legend>
                    {cascade.map(c => <label key={c.lv}>{t(`levels.${c.lv}`)}<select value={c.selected?.id ?? ''} disabled={!c.parent} onChange={e => pick(c.lv, c.parent?.id, e.target.value)}><option value="">{t('common.all')}</option>{c.options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>)}
                </fieldset>
                <div className="tb-actions">
                    <button type="button" className="workspace-button" aria-expanded={more} onClick={() => setMore(!more)}><SlidersHorizontal size={14} aria-hidden="true" />More filters{activeMore > 0 ? ` (${activeMore})` : ''}</button>
                    {chips.length > 0 && <button type="button" className="workspace-button" onClick={() => { setResetNote(''); setSp(new URLSearchParams(), { replace: true }); }}>{t('dash.resetFilters')}</button>}
                </div>
            </div>
            {more && <div className="tb-row tb-more">
                <label>Animal status<select value={f.astatus} onChange={e => setF({ astatus: e.target.value })}><option value="">{t('common.all')}</option>{animalStatuses.map(s => <option key={s} value={s}>{t(`state.${s}`)}</option>)}</select></label>
                <label>Breed<select value={f.breed} onChange={e => setF({ breed: e.target.value })}><option value="">{t('common.all')}</option>{breeds.map(b => <option key={b}>{b}</option>)}</select></label>
                <label>Transfer type<select value={f.ttype} onChange={e => setF({ ttype: e.target.value })}><option value="">{t('common.all')}</option>{transferTypes.map(x => <option key={x} value={x}>{t(`type.${x}`)}</option>)}</select></label>
                <label>Calf sex<select value={f.sex} onChange={e => setF({ sex: e.target.value })}><option value="">{t('common.all')}</option><option>Female</option><option>Male</option></select></label>
            </div>}
            {(chips.length > 0 || resetNote) && <div className="tb-chips" aria-label="Applied filters">{chips.map(c => <button type="button" key={c.k} className="filter-chip" onClick={() => c.k === 'node' ? setF({ node: root }) : setF({ [c.k]: '' } as Partial<Filters>)} aria-label={`Remove filter ${c.label}`}>{c.label}<X size={11} aria-hidden="true" /></button>)}{resetNote && <span className="reset-note" role="status">{resetNote}</span>}</div>}
        </form>

        {viewsOpen && <WorkspaceDialog title="Saved views" onClose={() => setViewsOpen(false)} wide><div className="animal-form">
            <p className="note-box">A saved view keeps the current filters and map layer. Views are private unless you share them with users in your jurisdiction and below.</p>
            <div className="views-list">
                {myViews.map(v => <div key={v.id} className="view-row"><div><b>{v.name}</b><small>{v.shared ? 'Shared downwards' : 'Private'}</small></div><div className="mini-actions"><button type="button" className="workspace-button small" onClick={() => { openView(v); setViewsOpen(false); }}>Open</button><button type="button" className="workspace-button small" aria-label={`Delete view ${v.name}`} onClick={() => act((s, u) => E.deleteView(s, u, v.id))}>Delete</button></div></div>)}
                {sharedViews.map(v => <div key={v.id} className="view-row"><div><b>{v.name}</b><small>Shared by {store.users.find(u => u.id === v.ownerId)?.name}</small></div><button type="button" className="workspace-button small" onClick={() => { openView(v); setViewsOpen(false); }}>Open</button></div>)}
                {!myViews.length && !sharedViews.length && <p className="registry-demo-note">No saved views yet.</p>}
            </div>
            <div className="views-save">
                <label className="field"><span>Save the current view as</span><input value={viewName} onChange={e => setViewName(e.target.value)} placeholder="e.g. Overdue pass-ons this week" /></label>
                <label className="views-share"><input type="checkbox" checked={shareView} onChange={e => setShareView(e.target.checked)} />Share with my jurisdiction and below</label>
                <button type="button" className="workspace-button green" disabled={!viewName.trim()} onClick={saveCurrent}>Save view</button>
            </div>
            {viewMsg && <p className="form-ok" role="status">{viewMsg}</p>}
        </div></WorkspaceDialog>}

        <Crumbs nodeId={f.node} rootId={root} onPick={id => { setResetNote(''); setF({ node: id }); }} />
        {has('widget_kpis') && <><div className="kpi-grid">{kpis()}</div>
        <p className="note-box" aria-live="polite">{summaryText}</p></>}

        {layers.length > 0 && <Panel title="Map" aside={<label className="mini-actions" style={{ alignItems: 'center' }}>Layer<select className="srs-input" value={activeLayer} onChange={e => setLayer(e.target.value as MapLayer)}>{layers.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}</select></label>}>
            <GirinkaMap points={points} villages={villagePoints} onDrill={drill} label={`Map of ${nodeName(f.node)}`} />
            <p className="registry-demo-note">Click a circle for its numbers and to drill down. Zoom in to see villages. Size shows the selected layer; green is normal, amber needs attention, red is critical. Markers show counts and animal tags only, never household names. Positions are placeholders until the official boundary data arrives.</p>
            <details><summary>Table view of the map</summary><table className="data-table"><thead><tr><th>Area</th><th className="num">{mapLayers.find(l => l.key === activeLayer)!.label}</th><th>Status</th></tr></thead><tbody>{points.map(p => <tr key={p.id}><td><button className="row-link" onClick={() => drill(p.id, p.level)}>{p.name}</button></td><td className="num">{p.value}</td><td><Badge state={p.severity === 'ok' ? 'ok' : p.severity === 'warn' ? 'amber' : 'red'} label={p.severity === 'ok' ? 'normal' : p.severity === 'warn' ? 'attention' : 'critical'} /></td></tr>)}</tbody></table></details>
        </Panel>}
        {child && rows.length > 0 && has('widget_children') && has('page_transfers') && <Panel title={`Transfers by ${childLabel.toLowerCase()} (click a bar to drill down)`}>
            <div className="chart-box" role="img" aria-label={rows.map(r => `${r.name}: ${r.completed} completed, ${r.open} open`).join('; ')}><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{ right: 16 }}><CartesianGrid vertical={false} stroke="#edf2f8" /><XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} height={50} textAnchor="end" /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={26} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="completed" name="Completed" stackId="a" fill={green} cursor="pointer" onClick={clickChild} /><Bar dataKey="open" name="In progress" stackId="a" fill={blue} cursor="pointer" onClick={clickChild} /></BarChart></ResponsiveContainer></div>
        </Panel>}
        {has('widget_children') && <div className="two-col">
            <Panel title={child ? `${childLabel} breakdown. Click a row to drill down` : 'Village detail'} aside={<ExportButton name={`isonga-${f.node}`} rows={exportRows} onExport={n => act((s, u) => can(u, 'export') ? E.logExport(s, u, `dashboard:${f.node}`, n, JSON.stringify(f)) : { s, ok: true, errors: [] })} />}>
                {child ? <div className="table-scroll"><table className="data-table"><thead><tr><th>{childLabel}</th><th className="num">Households</th><th className="num">Served</th><th className="num">Animals</th><th className="num">Done</th><th className="num">Open</th><th className="num">Overdue</th><th className="num">Target</th></tr></thead>
                    <tbody>{rows.map(r => <tr key={r.id}><td>{r.level === 'village' ? <Link className="row-link" to={`/households?village=${r.id}`}>{r.name}</Link> : <button className="row-link" onClick={() => { setResetNote(''); setF({ node: r.id }); }}>{r.name}</button>}</td><td className="num">{r.households}</td><td className="num">{r.served}</td><td className="num">{r.animals}</td><td className="num">{r.completed}</td><td className="num">{r.open}</td><td className="num">{r.overdue ? <Badge state={r.overdue > 1 ? 'red' : 'amber'} label={String(r.overdue)} /> : 0}</td><td className="num">{r.targetPct === null ? '-' : `${r.targetPct}%`}</td></tr>)}
                        {!rows.length && <tr><td colSpan={8} className="registry-empty">Nothing below this level.</td></tr>}</tbody></table></div>
                    : <p>This is the lowest level. Open <Link className="row-link" to={`/households?village=${f.node}`}>the households in this village</Link> or <Link className="row-link" to="/animals">their animals</Link>.</p>}
            </Panel>
            {has('widget_imihigo') && has('page_reports') && <Panel title="Imihigo progress (estimate)">
                <dl className="kv"><dt>Target (animals)</dt><dd>{m.target.target || 'No approved quota'}</dd><dt>Achieved</dt><dd>{m.target.achieved}</dd><dt>Percentage</dt><dd>{m.target.pct}%</dd><dt>Projected end of year</dt><dd>{m.target.projected} <Badge state="info" label={t('dash.estimate')} /></dd><dt>Method</dt><dd>{m.target.method}</dd></dl>
                <div className="bar-row" style={{ marginTop: 12 }}><span>Progress</span><div><i style={{ width: `${Math.min(100, m.target.pct)}%` }} /></div><b>{m.target.pct}%</b></div>
            </Panel>}
        </div>}

        <div className="two-col">
            {has('widget_pipeline') && has('page_transfers') && <Panel title="Transfer pipeline (click a bar to open those transfers)">
                <div className="chart-box" role="img" aria-label={m.pipeline.map(p => `${p.state}: ${p.n}`).join(', ')}><ResponsiveContainer width="100%" height="100%"><BarChart data={m.pipeline} layout="vertical" margin={{ left: 40, right: 16 }}><CartesianGrid horizontal={false} stroke="#edf2f8" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="state" tick={{ fontSize: 10 }} width={130} /><Tooltip /><Bar dataKey="n" name="Transfers" fill={green} radius={[0, 4, 4, 0]} cursor="pointer" onClick={clickPipeline} /></BarChart></ResponsiveContainer></div>
                <details><summary>Table view</summary><table className="data-table"><tbody>{m.pipeline.map(p => <tr key={p.state}><td>{t(`state.${p.state}`)}</td><td className="num">{p.n}</td></tr>)}</tbody></table></details>
            </Panel>}
            {has('widget_trend') && (has('page_transfers') || has('page_animals')) && <Panel title="Monthly trend (click a point to open the records)">
                <div className="chart-box" role="img" aria-label="Monthly completed transfers, calvings and exits"><ResponsiveContainer width="100%" height="100%"><LineChart data={m.trend} margin={{ right: 16 }}><CartesianGrid stroke="#edf2f8" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 9 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={26} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} /><Line dataKey="transfers" name="Transfers completed" stroke={green} strokeWidth={2} dot={false} activeDot={{ r: 6, cursor: 'pointer', onClick: dotClick('transfers') }} /><Line dataKey="calvings" name="Calvings" stroke={blue} strokeWidth={2} dot={false} activeDot={{ r: 6, cursor: 'pointer', onClick: dotClick('calvings') }} /><Line dataKey="exits" name="Exits" stroke={amber} strokeWidth={2} dot={false} activeDot={{ r: 6, cursor: 'pointer', onClick: dotClick('exits') }} /></LineChart></ResponsiveContainer></div>
                <details><summary>Table view</summary><div className="table-scroll"><table className="data-table"><thead><tr><th>Month</th><th className="num">Transfers</th><th className="num">Calvings</th><th className="num">Exits</th></tr></thead><tbody>{m.trend.map(r => <tr key={r.month}><td>{r.month}</td><td className="num">{r.transfers}</td><td className="num">{r.calvings}</td><td className="num">{r.exits}</td></tr>)}</tbody></table></div></details>
            </Panel>}
        </div>

        <div className="two-col">
            {has('widget_stages') && has('page_transfers') && <Panel title="Days per stage (mean and median)">
                <table className="data-table"><thead><tr><th>Stage</th><th className="num">Cases</th><th className="num">Mean</th><th className="num">Median</th></tr></thead><tbody>{m.stages.map(s => <tr key={s.label}><td>{s.label}</td><td className="num">{s.n}</td><td className="num">{s.mean.toFixed(1)}</td><td className="num">{s.median.toFixed(1)}</td></tr>)}</tbody></table>
                <p className="registry-demo-note">The median shows the normal pattern when a few cases are very late.</p>
            </Panel>}
            {has('widget_health') && has('page_animals') && <Panel title="Animal health index (click a row to list those animals)" aside={<span className="registry-demo-note">Rules are listed on each animal</span>}>
                {(['Good', 'Watch', 'At Risk'] as const).map(k => <Link key={k} to={`/animals?health=${encodeURIComponent(k)}`} className={`bar-row ${k === 'Watch' ? 'warn' : k === 'At Risk' ? 'bad' : ''}`}><span><Badge state={k} /></span><div><i style={{ width: `${(m.health[k] / Math.max(1, m.health.Good + m.health.Watch + m.health['At Risk'])) * 100}%` }} /></div><b>{m.health[k]}</b></Link>)}
            </Panel>}
        </div>

        {mine.length > 0 && has('widget_approvals') && has('page_approvals') && <Panel title={`Waiting for your approval (${mine.length})`} aside={<Link className="row-link" to="/approvals">Open the queue</Link>}>
            <table className="data-table"><tbody>{mine.slice(0, 5).map(tr => <tr key={tr.id}><td><Link className="row-link" to={`/transfers/${tr.id}`}>{tr.id}</Link></td><td>{t(`type.${tr.type}`)}</td><td><Badge state={tr.state} /></td></tr>)}</tbody></table>
        </Panel>}
        {has('widget_alerts') && has('page_alerts') && <Panel title="Alerts" aside={<Link className="row-link" to="/alerts">Open the alerts centre</Link>}>
            {m.alerts.slice(0, 5).map(a => <p key={a.id} className="alert-line"><Badge state={a.severity} label={a.severity} /> <Link className="row-link" to={a.link}>{a.rule}</Link>: {a.text}</p>)}
            {!m.alerts.length && <p>No alerts in this part of the hierarchy.</p>}
        </Panel>}
        <p className="registry-demo-note">In your jurisdiction ({nodeName(root)} and everything below it) you can see {data.households.length} households, {data.animals.length} animals and {data.transfers.length} transfers. Personal details stay masked unless your role needs them.</p>
        <p className="registry-demo-note">{t('common.demo')}</p>
    </div>;
}
