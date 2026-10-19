import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, Errors, PageHead, Panel, fmtDate, fmtDateTime } from '../components/ui';
import { RecordCalvingDialog, RecordExitDialog, RecordHealthDialog, TransferWizard } from '../components/forms';
import * as E from '../lib/engine';
import { ancestorAt, nodeMap } from '../data/hierarchy';
import { can, computeAlerts, exitedStatuses, holderLabel, inScope, verifyLedger } from '../lib/rules';
import type { RuleError } from '../lib/rules';

export default function AnimalProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const [tab, setTab] = useState<'chain' | 'calves' | 'health' | 'status'>('chain');
    const [dialog, setDialog] = useState<'calving' | 'health' | 'exit' | 'transfer' | null>(null);
    const [verify, setVerify] = useState<ReturnType<typeof verifyLedger> | null>(null);
    const [notice, setNotice] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const a = data.animals.find(x => x.id === id);
    if (!a) return <Empty title="Animal not found" text="It does not exist, or it is outside your jurisdiction." />;
    const u = user!;
    const transfers = data.transfers.filter(t => t.animalId === a.id);
    const calves = store.animals.filter(c => c.damId === a.id && data.animals.some(d => d.id === c.id));
    const dam = a.damId ? store.animals.find(x => x.id === a.damId) : undefined;
    const health = data.healthEvents.filter(e => e.animalId === a.id).sort((x, y) => y.date.localeCompare(x.date));
    const exit = store.exits.filter(e => e.animalId === a.id);
    const alerts = computeAlerts(store).filter(x => x.link === `/animals/${a.id}` || x.id.endsWith(a.id));
    const district = (hid: string) => { const h = store.households.find(x => x.id === hid); return ancestorAt(h?.villageId ?? (hid.startsWith('STORE-') ? hid.slice(6) : ''), 'district')?.id; };
    const staff = u.role !== 'household' && u.role !== 'auditor';
    const heldHere = a.holder.kind === 'household' && inScope(u, a.holder.nodeId);
    const live = !exitedStatuses.includes(a.status);
    const closeIt = () => { const r = act((s, x) => E.closeChain(s, x, a.id)); if (!r.ok) setErrors(r.errors); else { setErrors([]); setNotice('The chain is closed. It stays visible for reporting.'); } };
    const exportChain = () => {
        const v = verifyLedger(a);
        const blob = new Blob([JSON.stringify({ animal: { id: a.id, tag: a.tag }, verification: v, ledger: a.ledger }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = url; el.download = `${a.tag}-chain.json`; el.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        act((s, x) => E.logExport(s, x, `chain:${a.id}`, a.ledger.length, 'JSON'));
    };
    const holders = a.ledger.length ? [a.ledger[0].from, ...a.ledger.map(e => e.to)] : [];
    const done = (m: string) => { setDialog(null); setNotice(m); };
    return <div className="registry-page">
        <PageHead title={a.tag} sub={<>{a.breed} · {a.sex} · born {fmtDate(a.dob)}{a.dobEstimated ? ' (estimated)' : ''}{dam && <> · calf of <Link className="row-link" to={`/animals/${dam.id}`}>{dam.tag}</Link></>}</>}>
            <Badge state={a.status} />
            {staff && heldHere && live && can(u, 'record_event') && <><button className="workspace-button" onClick={() => setDialog('health')}>Record health</button>{!a.damId && a.sex === 'Female' && <button className="workspace-button" onClick={() => setDialog('calving')}>Register calving</button>}<button className="workspace-button danger" onClick={() => setDialog('exit')}>Record exit</button></>}
            {staff && can(u, 'create_transfer') && live && <button className="workspace-button green" onClick={() => setDialog('transfer')}>New transfer</button>}
            {staff && ['Deceased', 'Lost', 'Culled'].includes(a.status) && can(u, 'close_reverse') && u.role !== 'village_agent' && <button className="workspace-button" onClick={closeIt}>Close chain</button>}
            {(u.role === 'auditor' || u.role === 'district_coordinator') && <button className="workspace-button" onClick={exportChain}>Export chain (JSON)</button>}
        </PageHead>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <Errors errors={errors} />
        <div className="two-col">
            <Panel title="Identity and holder"><dl className="kv"><dt>Animal ID</dt><dd>{a.id}</dd><dt>Tag</dt><dd>{a.tag}</dd><dt>Colour and markings</dt><dd>{a.colour || '-'}</dd><dt>Source</dt><dd>{a.source}</dd>
                <dt>Current holder</dt><dd>{a.holder.kind === 'household' ? (u.role === 'household' ? holderLabel(a.holder, store) : <Link className="row-link" to={`/households/${a.holder.id}`}>{holderLabel(a.holder, store)}</Link>) : holderLabel(a.holder, store)}</dd>
                <dt>Location</dt><dd>{nodeMap[a.holder.nodeId]?.name}</dd>{a.pregnancyCheck && <><dt>Service date</dt><dd>{fmtDate(a.pregnancyCheck)}</dd></>}</dl></Panel>
            <Panel title="Open alerts and exits">
                {alerts.map(x => <p key={x.id}><Badge state={x.severity} label={x.severity} /> {x.rule}: {x.text}</p>)}
                {exit.map(e => <p key={e.id}><Badge state={e.state} /> {e.category} on {e.date} · evidence: {e.evidence.replace('_', ' ')}{e.state === 'Pending Verification' && staff && u.role === 'sector_officer' && <> <button className="workspace-button small" onClick={() => { const r = act((s, x) => E.verifyExit(s, x, e.id, 'verify', 'Verified on site')); if (!r.ok) setErrors(r.errors); else setNotice('Exit verified.'); }}>Verify</button></>}</p>)}
                {!alerts.length && !exit.length && <p>No open alerts.</p>}
            </Panel>
        </div>
        <div className="tabs" role="tablist">{(['chain', 'calves', 'health', 'status'] as const).map(k => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{{ chain: 'Chain of custody', calves: `Calves (${calves.length})`, health: `Health (${health.length})`, status: 'Status history' }[k]}</button>)}</div>
        {tab === 'chain' && <>
            <Panel title="Graph view" aside={<button className="workspace-button small" onClick={() => setVerify(verifyLedger(a))}><ShieldCheck size={13} />Verify ledger</button>}>
                {verify && <p className={verify.ok ? 'form-ok' : 'form-errors'} role="status">{verify.ok ? `Verified: ${a.ledger.length} entries, every hash matches.` : `Mismatch at entry ${verify.brokenAt}. A critical alert goes to the System Administrator and the National Programme Officer.`}</p>}
                <div className="mini-actions" style={{ alignItems: 'center' }}>{holders.map((h, i) => <span key={i} className="mini-actions" style={{ alignItems: 'center' }}>{i > 0 && <ArrowRight size={14} aria-hidden="true" />}<span className="badge badge-mute">{store.households.find(x => x.id === h)?.headName ?? (h.startsWith('STORE-') ? 'District store' : h === 'exit' ? 'Exit' : h === 'closed' ? 'Closed' : h)}</span>{i > 0 && district(holders[i - 1]) && district(h) && district(holders[i - 1]) !== district(h) && <Badge state="info" label="district boundary" />}</span>)}</div>
            </Panel>
            <Panel title="Timeline">
                <ol className="timeline">{a.ledger.map(e => <li key={e.seq}><b>{e.kind === 'transfer' || e.kind === 'reversal' ? <Link className="row-link" to={`/transfers/${e.ref}`}>{e.ref}</Link> : e.ref}</b> · {e.kind}<br />{store.households.find(x => x.id === e.from)?.headName ?? e.from} → {store.households.find(x => x.id === e.to)?.headName ?? e.to}<small>{fmtDateTime(e.ts)} · entry {e.seq}</small><code>{e.hash.slice(0, 24)}…</code></li>)}</ol>
                <h3 style={{ margin: '14px 0 6px', fontSize: 12 }}>Transfers</h3>
                {transfers.map(t => <p key={t.id}><Link className="row-link" to={`/transfers/${t.id}`}>{t.id}</Link> {t.type.replace('_', '-')} <Badge state={t.state} /></p>)}{!transfers.length && <p>No transfers in your view.</p>}
            </Panel></>}
        {tab === 'calves' && <Panel title="Calvings and calves">{calves.map(c => <p key={c.id}><Link className="row-link" to={`/animals/${c.id}`}>{c.tag}</Link> {c.sex} · born {fmtDate(c.dob)} <Badge state={c.status} /></p>)}{!calves.length && <p>No calves recorded.</p>}</Panel>}
        {tab === 'health' && <Panel title="Health history"><table className="data-table"><thead><tr><th>Date</th><th>Event</th><th>Product</th><th>Score</th><th>By</th></tr></thead><tbody>{health.map(e => <tr key={e.id}><td>{e.date}</td><td>{e.type.replace('_', ' ')}</td><td>{e.product}</td><td>{e.score ?? '-'}</td><td>{store.users.find(x => x.id === e.officerId)?.name ?? e.officerId}</td></tr>)}{!health.length && <tr><td colSpan={5}>No health events.</td></tr>}</tbody></table></Panel>}
        {tab === 'status' && <Panel title="Status history"><ol className="timeline">{a.statusHistory.map((s, i) => <li key={i}><Badge state={s.status} /> <small>{fmtDateTime(s.ts)} · {s.ref}</small></li>)}</ol></Panel>}
        {dialog === 'calving' && <RecordCalvingDialog damId={a.id} onClose={() => setDialog(null)} onDone={done} />}
        {dialog === 'health' && <RecordHealthDialog animalId={a.id} onClose={() => setDialog(null)} onDone={done} />}
        {dialog === 'exit' && <RecordExitDialog animalId={a.id} onClose={() => setDialog(null)} onDone={done} />}
        {dialog === 'transfer' && <TransferWizard presetAnimal={a.id} onClose={() => setDialog(null)} onDone={done} />}
    </div>;
}
