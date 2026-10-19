import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, ExportButton, PageHead, Pager, usePager } from '../components/ui';
import { RegisterAnimalDialog } from '../components/forms';
import { can, healthIndex, holderLabel } from '../lib/rules';
import * as E from '../lib/engine';
import type { AnimalStatus } from '../types';

const statuses: AnimalStatus[] = ['In District Store', 'Allocated (In Transit)', 'With Holder', 'Pregnant', 'Lactating', 'Deceased', 'Lost', 'Culled', 'Closed Chain'];

export default function Animals() {
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { t } = useTranslation();
    const [sp, setSp] = useSearchParams();
    const [q, setQ] = useState('');
    const [adding, setAdding] = useState(false);
    const [notice, setNotice] = useState('');
    const status = sp.get('status') ?? ''; const kind = sp.get('kind') ?? ''; const born = sp.get('born') ?? ''; const health = sp.get('health') ?? '';
    const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
    const rows = data.animals.filter(a => (!status || (status === 'Deceased' ? ['Deceased', 'Lost', 'Culled', 'Closed Chain'].includes(a.status) : a.status === status)) && (!born || a.dob.startsWith(born)) && (!health || (a.holder.kind === 'household' && healthIndex(store, a).status === health)) && (!kind || (kind === 'calf' ? !!a.damId : !a.damId)) && `${a.tag} ${a.breed} ${holderLabel(a.holder, store)}`.toLowerCase().includes(q.trim().toLowerCase()));
    const pager = usePager(rows, 12);
    const csv = [['Tag', 'Breed', 'Sex', 'Status', 'Holder'], ...rows.map(a => [a.tag, a.breed, a.sex, a.status, a.holder.kind === 'household' ? a.holder.id : a.holder.kind])];
    return <div className="registry-page">
        <PageHead title={t('nav.animals')} sub="One record per animal. Tags are unique and never reused, records are never deleted, and status changes only through a transfer or an event.">
            {can(user, 'register_animal') && <button className="workspace-button green" onClick={() => setAdding(true)}><Plus size={15} />Register animal</button>}
            {can(user, 'export') && <ExportButton rows={csv} name="isonga-animals" onExport={n => act((s, u) => E.logExport(s, u, 'animals', n, `status=${status}`))} />}
        </PageHead>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <div className="registry-toolbar"><div className="registry-search"><Search size={17} strokeWidth={1.6} /><input aria-label="Search animals" placeholder={t('common.search')} value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="registry-filters">
                <select aria-label="Status" value={status} onChange={e => set('status', e.target.value)}><option value="">All statuses</option>{statuses.map(s => <option key={s} value={s}>{t(`state.${s}`)}</option>)}</select>
                {born && <button className="workspace-button" onClick={() => set('born', '')}>Born in {born} (clear)</button>}
                {health && <button className="workspace-button" onClick={() => set('health', '')}>Health: {health} (clear)</button>}
                <select aria-label="Cow or calf" value={kind} onChange={e => set('kind', e.target.value)}><option value="">Cows and calves</option><option value="cow">Cows</option><option value="calf">Calves</option></select>
            </div></div>
        <div className="registry-table-panel panel"><div className="table-scroll"><table className="data-table"><thead><tr><th>Tag</th><th>Breed</th><th>Sex</th><th>Status</th><th>Holder</th><th>Health</th></tr></thead><tbody>
            {pager.rows.map(a => { const h = a.holder.kind === 'household' && !a.status.startsWith('Closed') ? healthIndex(store, a) : null; return <tr key={a.id}><td><Link className="row-link" to={`/animals/${a.id}`}>{a.tag}</Link>{a.damId ? <small> calf</small> : null}</td><td>{a.breed}</td><td>{a.sex}</td><td><Badge state={a.status} /></td><td>{holderLabel(a.holder, store)}</td><td>{h ? <Badge state={h.status} /> : '-'}</td></tr>; })}
            {!rows.length && <tr><td colSpan={6}><Empty title="No animals match" /></td></tr>}
        </tbody></table></div><Pager p={pager} /></div>
        <p className="registry-demo-note">{t('common.demo')}</p>
        {adding && <RegisterAnimalDialog onClose={() => setAdding(false)} onDone={m => { setAdding(false); setNotice(m); }} />}
    </div>;
}
