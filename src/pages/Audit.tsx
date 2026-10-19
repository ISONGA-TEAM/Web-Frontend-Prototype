import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, ExportButton, PageHead, Pager, usePager, fmtDateTime } from '../components/ui';
import * as E from '../lib/engine';
import { nodeMap } from '../data/hierarchy';

/** Append-only audit trail, searchable by user, record, action and date range (REQ-48). */
export default function Audit() {
    const { user } = useAuth();
    const { store, act } = useStore();
    const { t } = useTranslation();
    const [q, setQ] = useState(''); const [action, setAction] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [result, setResult] = useState('');
    const actions = [...new Set(store.audit.map(a => a.action))].sort();
    const rows = store.audit.filter(a => (!action || a.action === action) && (!result || a.result === result) && (!from || a.ts.slice(0, 10) >= from) && (!to || a.ts.slice(0, 10) <= to)
        && `${store.users.find(u => u.id === a.userId)?.name ?? a.userId} ${a.recordId}`.toLowerCase().includes(q.trim().toLowerCase())).slice().reverse();
    const pager = usePager(rows, 15);
    const csv = [['Time (UTC)', 'User', 'Role', 'Jurisdiction', 'Action', 'Record', 'Result', 'Detail'], ...rows.map(a => [a.ts, store.users.find(u => u.id === a.userId)?.name ?? a.userId, a.role, nodeMap[a.nodeId]?.name ?? a.nodeId, a.action, a.recordId, a.result, a.detail])];
    return <div className="registry-page">
        <PageHead title={t('nav.audit')} sub="Every creation, change, approval, dispatch, receipt, reversal, export and refused attempt. Entries cannot be edited or deleted.">
            {user!.role === 'auditor' && <ExportButton rows={csv} name="isonga-audit" onExport={n => act((s, u) => E.logExport(s, u, 'audit', n, `action=${action}`))} />}
        </PageHead>
        <form className="panel filter-bar" onSubmit={e => e.preventDefault()}>
            <label>User or record<input value={q} onChange={e => setQ(e.target.value)} /></label>
            <label>Action<select value={action} onChange={e => setAction(e.target.value)}><option value="">All</option>{actions.map(a => <option key={a}>{a}</option>)}</select></label>
            <label>Result<select value={result} onChange={e => setResult(e.target.value)}><option value="">All</option><option value="ok">ok</option><option value="denied">denied</option></select></label>
            <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        </form>
        <div className="registry-table-panel panel"><div className="table-scroll"><table className="data-table"><thead><tr><th>Time</th><th>User</th><th>Jurisdiction</th><th>Action</th><th>Record</th><th>Result</th><th>Detail</th></tr></thead><tbody>
            {pager.rows.map(a => <tr key={a.id}><td>{fmtDateTime(a.ts)}</td><td>{store.users.find(u => u.id === a.userId)?.name ?? a.userId}<br /><small>{a.role}</small></td><td>{nodeMap[a.nodeId]?.name}</td><td>{a.action}</td><td>{a.recordId}</td><td><Badge state={a.result === 'ok' ? 'ok' : 'red'} label={a.result} /></td><td><small>{a.detail}</small></td></tr>)}
        </tbody></table></div><Pager p={pager} /></div>
    </div>;
}
