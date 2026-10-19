import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, Errors, Field, PageHead, Panel, fmtDateTime } from '../components/ui';
import WorkspaceDialog from '../components/WorkspaceDialog';
import * as E from '../lib/engine';
import { hasEverReceived, holdsAny } from '../lib/rules';
import type { RuleError } from '../lib/rules';
import { descendantsOf, nodeMap } from '../data/hierarchy';
import type { SelectionList } from '../types';

const order: SelectionList['step'][] = ['Village nomination', 'Cell verification', 'Sector approval', 'District approval', 'Approved'];
const actor: Record<string, string> = { 'Village nomination': 'village_agent', 'Cell verification': 'cell_officer', 'Sector approval': 'sector_officer', 'District approval': 'district_coordinator' };

/** Beneficiary selection chain: village nomination, cell verification, sector approval, district approval (REQ-09). */
export default function Selection() {
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { t } = useTranslation();
    const [creating, setCreating] = useState(false);
    const [returning, setReturning] = useState<string | null>(null);
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [notice, setNotice] = useState('');
    const [village, setVillage] = useState('');
    const [picked, setPicked] = useState<string[]>([]);
    const villages = descendantsOf(user!.nodeId, 'village').concat(nodeMap[user!.nodeId].level === 'village' ? [nodeMap[user!.nodeId]] : []);
    const eligible = data.households.filter(h => h.villageId === village && h.status === 'Eligible' && !holdsAny(store, h.id) && !hasEverReceived(store, h.id));
    const advance = (id: string, action: 'advance' | 'return', comment = '') => {
        const r = act((s, u) => E.advanceList(s, u, id, comment, action));
        if (!r.ok) { setErrors(r.errors); return false; }
        setErrors([]); setNotice(action === 'advance' ? 'List moved to the next step.' : 'List returned to the previous step.'); return true;
    };
    const create = () => { const r = act((s, u) => E.createList(s, u, village, picked)); if (!r.ok) setErrors(r.errors); else { setCreating(false); setErrors([]); setNotice('List created. It starts at village nomination.'); setPicked([]); } };
    return <div className="registry-page">
        <PageHead title={t('nav.selection')} sub="Eligible households move village → cell → sector → district. Each step records the officer, date and comment. An approved list is locked; a change creates a new version.">
            {(user!.role === 'village_agent' || user!.role === 'cell_officer' || user!.role === 'sector_officer') && <button className="workspace-button green" onClick={() => { setVillage(villages[0]?.id ?? ''); setCreating(true); }}>New list</button>}
        </PageHead>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <Errors errors={errors} />
        {data.lists.map(l => {
            const idx = order.indexOf(l.step);
            const mine = !l.locked && actor[l.step] === user!.role;
            return <Panel key={l.id} title={`${l.id} · ${nodeMap[l.nodeId].name} · version ${l.version}`} aside={<Badge state={l.locked ? 'Approved' : 'Submitted'} label={l.step} />}>
                <div className="steps">{order.map((s, i) => <span key={s} className={i <= idx ? 'on' : ''}>{s}</span>)}</div>
                <p>{l.householdIds.map(id => { const h = store.households.find(x => x.id === id); return h ? <span key={id}><Link className="row-link" to={`/households/${id}`}>{h.headName}</Link> <Badge state={h.status} />{' '}</span> : null; })}</p>
                {l.log.length > 0 && <ul className="timeline">{l.log.map((e, i) => <li key={i}>{e.step}: {e.action === 'advance' ? 'passed' : 'returned'} by {store.users.find(u => u.id === e.by)?.name ?? e.by}{e.comment && ` (${e.comment})`}<small>{fmtDateTime(e.ts)}</small></li>)}</ul>}
                {mine && <div className="mini-actions" style={{ marginTop: 10 }}><button className="workspace-button green small" onClick={() => advance(l.id, 'advance')}>{l.step === 'Village nomination' ? 'Send to cell' : l.step === 'District approval' ? 'Approve and lock' : 'Pass to next level'}</button>{idx > 0 && <button className="workspace-button small" onClick={() => { setReturning(l.id); setErrors([]); }}>Return with reason</button>}</div>}
                {!mine && !l.locked && <p className="registry-demo-note">Waiting for the {actor[l.step]?.replace('_', ' ')}.</p>}
            </Panel>;
        })}
        {!data.lists.length && <Empty title="No selection lists in your jurisdiction" />}
        {creating && <WorkspaceDialog title="New nomination list" onClose={() => setCreating(false)} wide><div className="animal-form">
            <Field label="Village"><select value={village} onChange={e => { setVillage(e.target.value); setPicked([]); }}>{villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
            <p className="registry-demo-note">Only Eligible households that are not yet served can be nominated.</p>
            <div className="check-row">{eligible.map(h => <label key={h.id}><input type="checkbox" checked={picked.includes(h.id)} onChange={e => setPicked(e.target.checked ? [...picked, h.id] : picked.filter(x => x !== h.id))} />{h.headName}</label>)}</div>
            {!eligible.length && <p className="form-warn">No eligible, unserved households in this village.</p>}
            <Errors errors={errors} /><div className="dialog-actions"><button className="workspace-button" onClick={() => setCreating(false)}>Cancel</button><button className="workspace-button green" disabled={!picked.length} onClick={create}>Create list</button></div></div></WorkspaceDialog>}
        {returning && <ReturnDialog onClose={() => setReturning(null)} onSubmit={reason => { if (advance(returning, 'return', reason)) setReturning(null); return errors; }} />}
    </div>;
}

function ReturnDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => RuleError[] }) {
    const [reason, setReason] = useState('');
    return <WorkspaceDialog title="Return the list" onClose={onClose}><div className="animal-form"><Field label="Reason" required><textarea value={reason} onChange={e => setReason(e.target.value)} /></Field><div className="dialog-actions"><button className="workspace-button" onClick={onClose}>Cancel</button><button className="workspace-button danger" onClick={() => onSubmit(reason)}>Return</button></div></div></WorkspaceDialog>;
}
