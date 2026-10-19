import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, PageHead, Panel, fmtDate } from '../components/ui';
import { AssessDialog, VisitDialog } from '../components/forms';
import { can, hasEverReceived, holdsAny, maskNid, maskPhone } from '../lib/rules';
import { girinkaCriteria } from '../data/criteria';
import { nodeMap, pathOf } from '../data/hierarchy';

/** NFR-29: IDs and phone numbers are masked except for roles with a documented verification need. */
const needsUnmasked = ['village_agent', 'cell_officer', 'sector_officer'];

export default function HouseholdDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { store, data } = useStore();
    const [dialog, setDialog] = useState<'assess' | 'visit' | null>(null);
    const [notice, setNotice] = useState('');
    const h = data.households.find(x => x.id === id);
    if (!h) return <Empty title="Household not found" text="It does not exist, or it is outside your jurisdiction." />;
    const clear = needsUnmasked.includes(user!.role);
    const animals = data.animals.filter(a => a.holder.id === h.id);
    const visits = data.visits.filter(v => v.householdId === h.id).sort((a, b) => b.date.localeCompare(a.date));
    const transfers = data.transfers.filter(t => t.to.id === h.id || t.from.id === h.id);
    const done = (m: string) => { setDialog(null); setNotice(m); };
    return <div className="registry-page">
        <PageHead title={h.headName} sub={<>{h.id} · {pathOf(h.villageId).slice(2).map(n => n.name).join(' › ')}</>}>
            {can(user, 'assess') && <button className="workspace-button green" onClick={() => setDialog('assess')}>Assess eligibility</button>}
            {['sector_officer', 'cell_officer'].includes(user!.role) && <button className="workspace-button" onClick={() => setDialog('visit')}>Record a visit</button>}
        </PageHead>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <div className="two-col">
            <Panel title="Profile"><dl className="kv">
                <dt>Eligibility</dt><dd><Badge state={h.status} /> {holdsAny(store, h.id) && <Badge state="With Holder" label="Already served" />} {!holdsAny(store, h.id) && hasEverReceived(store, h.id) && <Badge state="Closed" label="Received before" />}</dd>
                <dt>National ID</dt><dd>{clear ? h.nid : maskNid(h.nid)} <small>({h.verification === 'manual' ? 'manually verified' : 'lookup'})</small></dd>
                <dt>Phone</dt><dd>{clear ? h.phone : maskPhone(h.phone)}</dd><dt>Sex / born</dt><dd>{h.sex === 'F' ? 'Female' : 'Male'} · {h.dob}</dd><dt>Household size</dt><dd>{h.size}</dd>
                <dt>Shelter and land</dt><dd>{h.shelter || '-'}</dd><dt>Vulnerability</dt><dd>{h.vulnerability.join(', ') || 'None recorded'}</dd><dt>Consent recorded</dt><dd>{fmtDate(h.consentOn)}</dd>
            </dl></Panel>
            <Panel title="Animals held">
                {animals.map(a => <p key={a.id}><Link className="row-link" to={`/animals/${a.id}`}>{a.tag}</Link> <Badge state={a.status} />{a.damId ? ' calf' : ''}</p>)}
                {!animals.length && <p>No animal is held by this household.</p>}
                <h3 style={{ marginTop: 14, fontSize: 12 }}>Transfers</h3>
                {transfers.map(t => <p key={t.id}><Link className="row-link" to={`/transfers/${t.id}`}>{t.id}</Link> {t.type.replace('_', '-')} <Badge state={t.state} /></p>)}
                {!transfers.length && <p>None.</p>}
            </Panel>
        </div>
        <Panel title="Assessment history">
            {h.assessments.slice().reverse().map(a => <details key={a.id} open={a === h.assessments[h.assessments.length - 1]}><summary><Badge state={a.result} /> {fmtDate(a.date)} · assessor {store.users.find(u => u.id === a.assessorId)?.name ?? a.assessorId}</summary>
                <table className="data-table"><tbody>{a.criteria.map(c => <tr key={c.key}><td>{girinkaCriteria.find(x => x.key === c.key)?.en ?? c.key}</td><td>{c.answer ? 'Yes' : 'No'}</td><td>evidence: {c.evidence}</td></tr>)}</tbody></table></details>)}
            {!h.assessments.length && <p>Not assessed yet. The household cannot be assigned an animal until it is Eligible.</p>}
        </Panel>
        <Panel title="Monitoring visits">
            <table className="data-table"><thead><tr><th>Date</th><th>Shelter</th><th>Animal</th><th>Feed and water</th><th>Issues</th></tr></thead><tbody>{visits.map(v => <tr key={v.id}><td>{fmtDate(v.date)}</td><td><Badge state={v.shelter === 'good' ? 'ok' : v.shelter === 'fair' ? 'amber' : 'red'} label={v.shelter} /></td><td><Badge state={v.animal === 'good' ? 'ok' : v.animal === 'fair' ? 'amber' : 'red'} label={v.animal} /></td><td><Badge state={v.feedWater === 'good' ? 'ok' : v.feedWater === 'fair' ? 'amber' : 'red'} label={v.feedWater} /></td><td>{v.issues || '-'}</td></tr>)}{!visits.length && <tr><td colSpan={5}>No visits recorded.</td></tr>}</tbody></table>
        </Panel>
        <p className="registry-demo-note">Village: {nodeMap[h.villageId].name}.</p>
        {dialog === 'assess' && <AssessDialog householdId={h.id} onClose={() => setDialog(null)} onDone={done} />}
        {dialog === 'visit' && <VisitDialog householdId={h.id} onClose={() => setDialog(null)} onDone={done} />}
    </div>;
}
