import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, ExportButton, PageHead, Pager, usePager } from '../components/ui';
import { RegisterHouseholdDialog } from '../components/forms';
import { can, hasEverReceived, holdsAny } from '../lib/rules';
import * as E from '../lib/engine';
import { isWithin, nodeMap } from '../data/hierarchy';
import type { EligibilityStatus } from '../types';

const statuses: EligibilityStatus[] = ['Registered', 'Eligible', 'Not Eligible', 'Needs Review'];

export default function Households() {
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { t } = useTranslation();
    const [sp, setSp] = useSearchParams();
    const [q, setQ] = useState('');
    const [adding, setAdding] = useState(false);
    const [notice, setNotice] = useState('');
    const status = sp.get('status') ?? ''; const village = sp.get('village') ?? ''; const served = sp.get('served') ?? '';
    const rows = data.households.filter(h => (!status || h.status === status) && (!village || isWithin(h.villageId, village)) && (!served || (served === 'yes' ? hasEverReceived(store, h.id) || holdsAny(store, h.id) : !(hasEverReceived(store, h.id) || holdsAny(store, h.id)))) && `${h.headName} ${h.id} ${nodeMap[h.villageId].name}`.toLowerCase().includes(q.trim().toLowerCase()));
    const pager = usePager(rows, 12);
    const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
    const csv = [['ID', 'Village', 'Eligibility', 'Holds animal'], ...rows.map(h => [h.id, nodeMap[h.villageId].name, h.status, holdsAny(store, h.id) ? 'yes' : 'no'])];
    return <div className="registry-page">
        <PageHead title={t('nav.households')} sub="Households in your jurisdiction. National IDs and phone numbers are masked unless your role needs them to verify a household.">
            {can(user, 'nominate_household') && <button className="workspace-button green" onClick={() => setAdding(true)}><UserPlus size={15} />Register household</button>}
            {can(user, 'export') && <ExportButton rows={csv} name="isonga-households" onExport={n => act((s, u) => E.logExport(s, u, 'households', n, `status=${status};village=${village}`))} />}
        </PageHead>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <div className="registry-toolbar"><div className="registry-search"><Search size={17} strokeWidth={1.6} /><input aria-label="Search households" placeholder={t('common.search')} value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="registry-filters">
                <select aria-label="Eligibility" value={status} onChange={e => set('status', e.target.value)}><option value="">All eligibility</option>{statuses.map(s => <option key={s} value={s}>{t(`state.${s}`)}</option>)}</select>
                <select aria-label="Served" value={served} onChange={e => set('served', e.target.value)}><option value="">Served or not</option><option value="yes">Served</option><option value="no">Not served</option></select>
                {village && <button className="workspace-button" onClick={() => set('village', '')}>Village: {nodeMap[village]?.name} (clear)</button>}
            </div></div>
        <div className="registry-table-panel panel"><div className="table-scroll"><table className="data-table"><thead><tr><th>Head of household</th><th>Village</th><th>Eligibility</th><th>Girinka</th><th>Registered</th></tr></thead><tbody>
            {pager.rows.map(h => <tr key={h.id}><td><Link className="row-link" to={`/households/${h.id}`}>{h.headName}</Link><br /><small>{h.id}</small></td><td>{nodeMap[h.villageId].name}</td><td><Badge state={h.status} /></td><td>{holdsAny(store, h.id) ? <Badge state="With Holder" label="Holds an animal" /> : hasEverReceived(store, h.id) ? <Badge state="Closed" label="Received before" /> : <Badge state="Registered" label="Not served" />}</td><td>{new Date(h.registeredOn).toLocaleDateString('en-GB')}</td></tr>)}
            {!rows.length && <tr><td colSpan={5}><Empty title="No households match" text="Clear a filter or change your search." /></td></tr>}
        </tbody></table></div><Pager p={pager} /></div>
        <p className="registry-demo-note">{t('common.demo')}</p>
        {adding && <RegisterHouseholdDialog onClose={() => setAdding(false)} onDone={m => { setAdding(false); setNotice(m); }} />}
    </div>;
}
