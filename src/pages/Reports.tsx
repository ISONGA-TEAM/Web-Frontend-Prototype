import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Errors, ExportButton, Field, PageHead, Panel } from '../components/ui';
import WorkspaceDialog from '../components/WorkspaceDialog';
import * as E from '../lib/engine';
import { can, targetProgress } from '../lib/rules';
import type { RuleError } from '../lib/rules';
import { applyFilters, childRows, emptyFilters, summary } from '../lib/metrics';
import { childrenOf, nodeMap, nextLevel } from '../data/hierarchy';

/** Imihigo targets and standard reports. Reports use the same functions as the dashboards, so their figures always agree (REQ-43). */
export default function Reports() {
    const { user } = useAuth();
    const { store, data, act, asOf } = useStore();
    const { t } = useTranslation();
    const root = user!.nodeId;
    const f = emptyFilters(root);
    const filtered = applyFilters(store, data, f);
    const m = summary(store, filtered, f, asOf);
    const rows = childRows(store, data, f, asOf);
    const child = nextLevel(nodeMap[root].level);
    const [editing, setEditing] = useState<string | null>(null);
    const [animals, setAnimals] = useState(0); const [hh, setHh] = useState(0); const [reason, setReason] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [notice, setNotice] = useState('');
    const canSet = can(user, 'manage_targets');
    const open = (id: string) => { const tp = targetProgress(store, id, asOf); setAnimals(tp.target); setHh(tp.households); setReason(''); setErrors([]); setEditing(id); };
    const save = () => { const r = act((s, u) => E.setTarget(s, u, editing!, animals, hh, reason)); if (!r.ok) setErrors(r.errors); else { setEditing(null); setNotice('Quota saved as a new version, with an audit entry.'); } };
    const year = new Date(asOf).getFullYear();
    const report = [
        `Girinka report for ${nodeMap[root].name}, generated ${new Date(asOf).toLocaleDateString('en-GB')}.`,
        `Households served: ${m.served}. Animals in circulation: ${m.animalsInCirculation}. Calvings this year: ${m.calvingsThisYear}.`,
        `Imihigo ${year}: ${m.target.achieved} of ${m.target.target} animals (${m.target.pct}%). Projected end of year ${m.target.projected} (estimate).`,
        `Pass-on: ${m.passOnDue} calves due, ${m.passOnOverdue} overdue, completion on time ${m.passOnRate}%.`,
        `Transfers waiting for approval: ${m.approvalsWaiting}. In transit: ${m.inTransit}. Receipts overdue: ${m.receiptsOverdue}.`,
        `Open alerts: ${m.alerts.filter(a => !a.state || a.state.status !== 'Resolved').length}.`,
    ];
    return <div className="registry-page">
        <PageHead title={t('nav.reports')} sub={`Progress against the approved quota record for ${year}. Targets are read only from the quota record (REQ-39).`} />
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <Panel title={`Imihigo ${year}: ${nodeMap[root].name}`}>
            <dl className="kv"><dt>Target animals</dt><dd>{m.target.target || 'No approved quota'}</dd><dt>Target households</dt><dd>{m.target.households}</dd><dt>Achieved</dt><dd>{m.target.achieved} ({m.target.pct}%)</dd><dt>Projected end of year</dt><dd>{m.target.projected} <Badge state="info" label="estimate" /></dd><dt>Method</dt><dd>{m.target.method}</dd></dl>
        </Panel>
        {child && <Panel title={`By ${t(`levels.${child}`).toLowerCase()}`} aside={<ExportButton name={`isonga-imihigo-${root}`} rows={[[child, 'Target', 'Achieved', '%'], ...rows.map(r => [r.name, r.target, r.achieved, r.targetPct ?? ''].map(String))]} onExport={n => act((s, u) => can(u, 'export') ? E.logExport(s, u, `imihigo:${root}`, n, '') : { s, ok: true, errors: [] })} />}>
            <div className="table-scroll"><table className="data-table"><thead><tr><th>{t(`levels.${child}`)}</th><th className="num">Target</th><th className="num">Achieved</th><th className="num">%</th><th className="num">Projected</th>{canSet && <th />}</tr></thead><tbody>
                {childrenOf(root).map(c => { const tp = targetProgress(store, c.id, asOf); return <tr key={c.id}><td>{c.name}</td><td className="num">{tp.target || '-'}</td><td className="num">{tp.achieved}</td><td className="num">{tp.target ? `${tp.pct}%` : '-'}</td><td className="num">{tp.target ? tp.projected : '-'}</td>{canSet && <td><button className="workspace-button small" onClick={() => open(c.id)}>Set quota</button></td>}</tr>; })}
            </tbody></table></div></Panel>}
        <Panel title="Standard report (generated from the same records)" aside={<button className="workspace-button small" onClick={() => window.print()}>Print or save as PDF</button>}>
            {report.map((l, i) => <p key={i}>{l}</p>)}
            <p className="registry-demo-note">Drafting reports with an AI assistant (REQ-44) is a later phase and is not part of this prototype. Reports here are computed text, so every figure matches the dashboard.</p>
        </Panel>
        {editing && <WorkspaceDialog title={`Quota for ${nodeMap[editing].name}`} onClose={() => setEditing(null)}><div className="animal-form">
            <p className="note-box">Child quotas together cannot exceed the parent quota. Changing an approved quota creates a new version and needs a reason.</p>
            <Field label="Animals" required><input type="number" min={0} value={animals} onChange={e => setAnimals(Number(e.target.value))} /></Field>
            <Field label="Households"><input type="number" min={0} value={hh} onChange={e => setHh(Number(e.target.value))} /></Field>
            <Field label="Reason for change"><textarea value={reason} onChange={e => setReason(e.target.value)} /></Field>
            <Errors errors={errors} /><div className="dialog-actions"><button className="workspace-button" onClick={() => setEditing(null)}>Cancel</button><button className="workspace-button green" onClick={save}>Save new version</button></div></div></WorkspaceDialog>}
    </div>;
}
