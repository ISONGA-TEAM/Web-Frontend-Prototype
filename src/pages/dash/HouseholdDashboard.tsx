import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Badge, Errors, Field, PageHead, Panel, fmtDate } from '../../components/ui';
import WorkspaceDialog from '../../components/WorkspaceDialog';
import * as E from '../../lib/engine';
import { addMonths, can, daysBetween, healthIndex } from '../../lib/rules';
import type { RuleError } from '../../lib/rules';
import type { Grievance } from '../../types';

export default function HouseholdDashboard({ embedded = false }: { embedded?: boolean }) {
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { t } = useTranslation();
    const [ackFor, setAckFor] = useState<string | null>(null);
    const [griev, setGriev] = useState(false);
    const [code, setCode] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [notice, setNotice] = useState('');
    const me = data.households[0];
    if (!me) return <p className="empty">Your household record was not found.</p>;
    const mine = data.animals.filter(a => a.holder.id === me.id);
    const calves = mine.filter(a => a.damId);
    const toSign = data.transfers.filter(tr => tr.state === 'Received' && tr.to.id === me.id && !tr.ack && (tr.type === 'primary' || tr.type === 'pass_on'));
    const toReceive = data.transfers.filter(tr => tr.state === 'Dispatched' && tr.to.id === me.id);
    const nextVet = (id: string) => { const last = store.healthEvents.filter(e => e.animalId === id && e.type === 'vaccination').sort((a, b) => b.date.localeCompare(a.date))[0]; return last ? addMonths(last.date, store.config.vaccineIntervalDays / 30) : undefined; };
    const sign = (e: FormEvent) => { e.preventDefault(); const r = act((s, u) => E.acknowledgeTransfer(s, u, ackFor!, 'otp', code, 'Household view')); if (!r.ok) setErrors(r.errors); else { setAckFor(null); setNotice('Thank you. The transfer is complete.'); setCode(''); } };
    const raise = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); const r = act((s, u) => E.raiseGrievance(s, u, f.get('category') as Grievance['category'], String(f.get('text')))); if (!r.ok) setErrors(r.errors); else { setGriev(false); setNotice('Your grievance was sent. It is acknowledged within 3 working days.'); } };
    const download = () => {
        const record = { household: { ...me, phone: me.phone }, animals: mine.map(a => ({ tag: a.tag, status: a.status, chain: a.ledger })), transfers: data.transfers };
        const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${me.id}-record.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        act((s, u) => E.logDataRequest(s, u, 'export', me.id));
    };
    return <div className="overview-page">
        {embedded ? <h2 style={{ margin: '24px 0 12px', fontSize: 14 }}>{t('dash.household')}</h2> : null}
        {!embedded && <PageHead title={t('dash.household')} sub={`${me.headName} · ${me.id}`}>
            <button className="workspace-button" onClick={download}><Download size={15} />Download my record (JSON)</button>
            {can(user, 'raise_grievance') && <button className="workspace-button green" onClick={() => { setErrors([]); setGriev(true); }}><MessageSquarePlus size={15} />Raise a grievance</button>}
        </PageHead>}
        {notice && <p className="form-ok" role="status">{notice}</p>}
        {can(user, 'widget_my_status') && <div className="two-col">
            <Panel title="My eligibility"><p><Badge state={me.status} /> {me.assessments.length ? `Assessed ${fmtDate(me.assessments[me.assessments.length - 1].date)}` : 'Not assessed yet'}</p><p className="registry-demo-note">Verification: {me.verification === 'manual' ? 'confirmed manually by an officer' : 'national ID lookup'}.</p></Panel>
            <Panel title="Grievances">{data.grievances.map(g => <p key={g.id}><Badge state={g.status} /> {g.category.replace('_', ' ')} · raised {fmtDate(g.raisedOn)}{g.outcome ? ` · outcome: ${g.outcome}` : ''}</p>)}{!data.grievances.length && <p>You have no grievances.</p>}</Panel>
        </div>}
        {can(user, 'widget_my_actions') && (toSign.length > 0 || toReceive.length > 0) && <Panel title="Needs your action">
            {toReceive.map(tr => <p key={tr.id}><Badge state="Dispatched" /> <Link className="row-link" to={`/transfers/${tr.id}`}>An animal is on its way. Confirm when it arrives.</Link></p>)}
            {toSign.map(tr => <p key={tr.id}><Badge state="Received" /> Acknowledgment to sign for {store.animals.find(a => a.id === tr.animalId)?.tag} <button className="workspace-button small" onClick={() => { setErrors([]); setAckFor(tr.id); }}>Sign with one-time code</button></p>)}
        </Panel>}
        {can(user, 'widget_my_animals') && <Panel title="My animals">
            <div className="table-scroll"><table className="data-table"><thead><tr><th>Tag</th><th>Status</th><th>Health</th><th>Next vaccination</th></tr></thead><tbody>
                {mine.map(a => { const h = healthIndex(store, a); const nv = nextVet(a.id); return <tr key={a.id}><td><Link className="row-link" to={`/animals/${a.id}`}>{a.tag}</Link>{a.damId ? ' (calf)' : ''}</td><td><Badge state={a.status} /></td><td><Badge state={h.status} /></td><td>{nv ? `${fmtDate(nv)}${daysBetween(Date.now(), nv) < 0 ? ' (overdue)' : ''}` : 'Not scheduled'}</td></tr>; })}
                {!mine.length && <tr><td colSpan={4} className="registry-empty">No animals are registered to your household.</td></tr>}</tbody></table></div>
            {calves.length > 0 && <p className="registry-demo-note">{calves.length} calf/calves. The first female calf is passed on to another eligible household when it reaches {store.config.passOnAgeMonths} months.</p>}
        </Panel>}
        {can(user, 'widget_my_transfers') && <Panel title="My transfers">
            <table className="data-table"><tbody>{data.transfers.map(tr => <tr key={tr.id}><td><Link className="row-link" to={`/transfers/${tr.id}`}>{tr.id}</Link></td><td>{t(`type.${tr.type}`)}</td><td><Badge state={tr.state} /></td><td>{store.animals.find(a => a.id === tr.animalId)?.tag}</td></tr>)}{!data.transfers.length && <tr><td>No transfers yet.</td></tr>}</tbody></table>
        </Panel>}
        {ackFor && <WorkspaceDialog title="Sign acknowledgment" onClose={() => setAckFor(null)}><form className="animal-form" onSubmit={sign}>
            <p className="note-box">By entering the one-time code sent to your registered phone you confirm that you received this animal.</p>
            <p>Demo SMS: <span className="otp-box">{E.otpFor(store.transfers.find(x => x.id === ackFor)!)}</span></p>
            <Field label="One-time code" required><input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" maxLength={6} /></Field>
            <Errors errors={errors} /><div className="dialog-actions"><button type="button" className="workspace-button" onClick={() => setAckFor(null)}>Cancel</button><button className="workspace-button green">Confirm</button></div></form></WorkspaceDialog>}
        {griev && <WorkspaceDialog title="Raise a grievance" onClose={() => setGriev(false)}><form className="animal-form" onSubmit={raise}>
            <Field label="About"><select name="category"><option value="eligibility">My eligibility</option><option value="transfer">A transfer</option><option value="receipt">A receipt</option><option value="animal_care">The care of my animal</option></select></Field>
            <Field label="What happened?" required><textarea name="text" /></Field>
            <Errors errors={errors} /><div className="dialog-actions"><button type="button" className="workspace-button" onClick={() => setGriev(false)}>Cancel</button><button className="workspace-button green">Send</button></div></form></WorkspaceDialog>}
        <p className="registry-demo-note">{t('common.demo')}</p>
    </div>;
}
