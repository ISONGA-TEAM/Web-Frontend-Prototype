import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, Errors, Field, PageHead, Pager, usePager, fmtDate } from '../components/ui';
import WorkspaceDialog from '../components/WorkspaceDialog';
import * as E from '../lib/engine';
import { alertsFor } from '../lib/rules';
import type { Alert, RuleError } from '../lib/rules';
import { nodeMap } from '../data/hierarchy';

/** Alerts centre: thresholds are configured by MINALOC (REQ-38). Every alert has an owner, a due date and a status. */
export default function Alerts() {
    const { user } = useAuth();
    const { store, act } = useStore();
    const { t } = useTranslation();
    const [sev, setSev] = useState(''); const [status, setStatus] = useState(''); const [rule, setRule] = useState('');
    const [resolving, setResolving] = useState<Alert | null>(null);
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const all = alertsFor(store, user!);
    const rows = all.filter(a => (!sev || a.severity === sev) && (!status || (a.state?.status ?? 'New') === status) && (!rule || a.rule === rule));
    const pager = usePager(rows, 12);
    const canAct = user!.role !== 'auditor';
    const ack = (a: Alert) => { const r = act((s, u) => E.setAlertState(s, u, a.id, 'Acknowledged', '')); if (!r.ok) setErrors(r.errors); };
    const resolve = () => { const r = act((s, u) => E.setAlertState(s, u, resolving!.id, 'Resolved', note)); if (!r.ok) setErrors(r.errors); else { setResolving(null); setNote(''); setErrors([]); } };
    return <div className="registry-page">
        <PageHead title={t('nav.alerts')} sub="Alerts are generated when a threshold is crossed. Resolving one needs a note." />
        <div className="registry-toolbar"><div className="registry-filters">
            <select aria-label="Severity" value={sev} onChange={e => setSev(e.target.value)}><option value="">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select>
            <select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['New', 'Acknowledged', 'Resolved'].map(s => <option key={s} value={s}>{t(`state.${s}`)}</option>)}</select>
            <select aria-label="Rule" value={rule} onChange={e => setRule(e.target.value)}><option value="">All rules</option>{[...new Set(all.map(a => a.rule))].map(r => <option key={r}>{r}</option>)}</select>
        </div></div>
        <Errors errors={errors} />
        <div className="registry-table-panel panel"><div className="table-scroll"><table className="data-table"><thead><tr><th>Severity</th><th>Alert</th><th>Where</th><th>Owner</th><th>Due</th><th>Status</th><th /></tr></thead><tbody>
            {pager.rows.map(a => { const st = a.state?.status ?? 'New'; return <tr key={a.id}><td><Badge state={a.severity} label={a.severity} /></td><td><Link className="row-link" to={a.link}>{a.rule}</Link><br /><small>{a.text}</small>{a.state?.note && <><br /><small>Note: {a.state.note}</small></>}</td><td>{nodeMap[a.nodeId]?.name}</td><td>{a.ownerRole.replaceAll('_', ' ')}</td><td>{fmtDate(a.due)}</td><td><Badge state={st} /></td>
                <td>{canAct && st !== 'Resolved' && <div className="mini-actions">{st === 'New' && <button className="workspace-button small" onClick={() => ack(a)}>Acknowledge</button>}<button className="workspace-button green small" onClick={() => { setResolving(a); setErrors([]); }}>Resolve</button></div>}</td></tr>; })}
            {!rows.length && <tr><td colSpan={7}><Empty title="No alerts" text="Nothing crosses a threshold in your jurisdiction." /></td></tr>}
        </tbody></table></div><Pager p={pager} /></div>
        {resolving && <WorkspaceDialog title="Resolve alert" onClose={() => setResolving(null)}><div className="animal-form"><p>{resolving.text}</p><Field label="Resolution note" required><textarea value={note} onChange={e => setNote(e.target.value)} /></Field><Errors errors={errors} /><div className="dialog-actions"><button className="workspace-button" onClick={() => setResolving(null)}>Cancel</button><button className="workspace-button green" onClick={resolve}>Resolve</button></div></div></WorkspaceDialog>}
    </div>;
}
