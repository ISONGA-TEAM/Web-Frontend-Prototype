import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, ExportButton, PageHead, Pager, usePager, fmtDate } from '../components/ui';
import { TransferWizard } from '../components/forms';
import { can, holderLabel, transferTypes } from '../lib/rules';
import * as E from '../lib/engine';
import type { TransferState } from '../types';

const states: TransferState[] = ['Draft', 'Submitted', 'Pending Next Approval', 'Approved', 'Dispatched', 'Received', 'Completed', 'Returned', 'Rejected', 'Disputed', 'Cancelled'];

export default function Transfers() {
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { t } = useTranslation();
    const nav = useNavigate();
    const [sp, setSp] = useSearchParams();
    const [q, setQ] = useState('');
    const [wizard, setWizard] = useState(false);
    const state = sp.get('state') ?? ''; const type = sp.get('type') ?? ''; const month = sp.get('month') ?? '';
    const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
    const rows = data.transfers.filter(tr => (!state || tr.state === state) && (!type || tr.type === type) && (!month || (tr.completedAt ?? '').startsWith(month)) && `${tr.id} ${store.animals.find(a => a.id === tr.animalId)?.tag ?? ''} ${holderLabel(tr.from, store)} ${holderLabel(tr.to, store)}`.toLowerCase().includes(q.trim().toLowerCase())).slice().reverse();
    const pager = usePager(rows, 12);
    const csv = [['Transfer', 'Type', 'Animal', 'From', 'To', 'State', 'Created'], ...rows.map(tr => [tr.id, tr.type, store.animals.find(a => a.id === tr.animalId)?.tag ?? '', holderLabel(tr.from, store), holderLabel(tr.to, store), tr.state, tr.createdAt.slice(0, 10)])];
    return <div className="registry-page">
        <PageHead title={t('nav.transfers')} sub="Every change of holder: requested, approved level by level, dispatched, received and acknowledged. Completed transfers are sealed in the animal’s chain ledger.">
            {can(user, 'create_transfer') && <button className="workspace-button green" onClick={() => setWizard(true)}><Plus size={15} />New transfer</button>}
            {can(user, 'export') && <ExportButton rows={csv} name="isonga-transfers" onExport={n => act((s, u) => E.logExport(s, u, 'transfers', n, `state=${state};type=${type}`))} />}
        </PageHead>
        <div className="registry-toolbar"><div className="registry-search"><Search size={17} strokeWidth={1.6} /><input aria-label="Search transfers" placeholder={t('common.search')} value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="registry-filters">
                <select aria-label="State" value={state} onChange={e => set('state', e.target.value)}><option value="">All states</option>{states.map(s => <option key={s} value={s}>{t(`state.${s}`)}</option>)}</select>
                {month && <button className="workspace-button" onClick={() => set('month', '')}>Completed in {month} (clear)</button>}
                <select aria-label="Type" value={type} onChange={e => set('type', e.target.value)}><option value="">All types</option>{transferTypes.map(x => <option key={x} value={x}>{t(`type.${x}`)}</option>)}</select>
            </div></div>
        <div className="registry-table-panel panel"><div className="table-scroll"><table className="data-table"><thead><tr><th>Transfer</th><th>Type</th><th>Animal</th><th>From</th><th>To</th><th>State</th><th>Created</th></tr></thead><tbody>
            {pager.rows.map(tr => <tr key={tr.id}><td><Link className="row-link" to={`/transfers/${tr.id}`}>{tr.id}</Link></td><td>{t(`type.${tr.type}`)}</td><td>{store.animals.find(a => a.id === tr.animalId)?.tag}</td><td>{holderLabel(tr.from, store)}</td><td>{holderLabel(tr.to, store)}</td><td><Badge state={tr.state} /></td><td>{fmtDate(tr.createdAt)}</td></tr>)}
            {!rows.length && <tr><td colSpan={7}><Empty title="No transfers match" /></td></tr>}
        </tbody></table></div><Pager p={pager} /></div>
        <p className="registry-demo-note">{t('common.demo')}</p>
        {wizard && <TransferWizard onClose={() => setWizard(false)} onDone={(_m, id) => { setWizard(false); if (id) nav(`/transfers/${id}`); }} />}
    </div>;
}
