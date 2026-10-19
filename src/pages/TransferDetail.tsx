import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, Errors, PageHead, Panel, fmtDateTime } from '../components/ui';
import TransferActionDialog from '../components/TransferActions';
import type { ActionKind } from '../components/TransferActions';
import * as E from '../lib/engine';
import { approvalDenial, can, holderLabel, inScope, pendingSlot } from '../lib/rules';
import type { RuleError } from '../lib/rules';
import { nodeMap, ancestorAt } from '../data/hierarchy';

const flow = ['Draft', 'Submitted', 'Approved', 'Dispatched', 'Received', 'Completed'] as const;

export default function TransferDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { t } = useTranslation();
    const [dialog, setDialog] = useState<ActionKind | null>(null);
    const [notice, setNotice] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const tr = data.transfers.find(x => x.id === id);
    if (!tr) return <Empty title="Transfer not found" text="It does not exist, or it is outside your jurisdiction." />;
    const animal = store.animals.find(a => a.id === tr.animalId)!;
    const u = user!;
    const slot = pendingSlot(tr);
    const denial = slot ? approvalDenial(u, tr) : null;
    const own = u.role === 'household' && u.householdId === tr.to.id;
    const officer = u.role !== 'household';
    const canReceive = own || (can(u, 'confirm_receipt') && officer && inScope(u, tr.to.nodeId));
    const needsAck = tr.type === 'primary' || tr.type === 'pass_on';
    const actions: { kind: ActionKind; label: string; danger?: boolean }[] = [];
    if (['Draft', 'Returned'].includes(tr.state) && can(u, 'create_transfer') && officer && (inScope(u, tr.from.nodeId) || inScope(u, tr.to.nodeId))) actions.push({ kind: 'cancel', label: 'Cancel', danger: true });
    if (denial === null && slot) actions.push({ kind: 'approve', label: 'Approve' }, { kind: 'return', label: 'Return with reason' }, { kind: 'reject', label: 'Reject', danger: true });
    if (tr.state === 'Approved' && can(u, 'confirm_receipt') && officer && inScope(u, tr.from.nodeId)) actions.push({ kind: 'dispatch', label: 'Record dispatch' }, { kind: 'cancel', label: 'Cancel', danger: true });
    if (tr.state === 'Dispatched' && canReceive) actions.push({ kind: 'receipt', label: 'Confirm receipt' });
    if (tr.state === 'Disputed' && u.role === 'district_coordinator' && (inScope(u, tr.from.nodeId) || inScope(u, tr.to.nodeId))) actions.push({ kind: 'resolve_accept', label: 'Accept as received' }, { kind: 'resolve_cancel', label: 'Cancel transfer', danger: true });
    if (tr.state === 'Received' && needsAck && canReceive) actions.push({ kind: 'ack_otp', label: 'Acknowledge with one-time code' });
    if (tr.state === 'Received' && needsAck && u.role === 'cell_officer' && inScope(u, tr.to.nodeId)) actions.push({ kind: 'ack_paper', label: 'Attach paper acknowledgment' });
    if (tr.state === 'Completed' && ['district_coordinator', 'provincial_officer', 'national_officer'].includes(u.role) && (inScope(u, tr.from.nodeId) || inScope(u, tr.to.nodeId)) && tr.type !== 'reversal') actions.push({ kind: 'reverse', label: 'Reverse', danger: true });
    const submittable = ['Draft', 'Returned'].includes(tr.state) && can(u, 'create_transfer') && officer && (inScope(u, tr.from.nodeId) || inScope(u, tr.to.nodeId));
    const doSubmit = () => { const r = act((s, x) => E.submitTransfer(s, x, tr.id)); if (!r.ok) setErrors(r.errors); else { setErrors([]); setNotice('Submitted for approval.'); } };
    const doComplete = () => { const r = act((s, x) => E.completeTransfer(s, x, tr.id)); if (!r.ok) setErrors(r.errors); else { setErrors([]); setNotice('Transfer completed.'); } };
    const ledger = animal.ledger.find(e => e.ref === tr.id);
    const crossing = ancestorAt(tr.from.nodeId, 'district')?.id !== ancestorAt(tr.to.nodeId, 'district')?.id;
    const stepIndex = flow.indexOf((tr.state === 'Pending Next Approval' ? 'Submitted' : ['Returned', 'Rejected', 'Cancelled'].includes(tr.state) ? 'Draft' : tr.state === 'Disputed' ? 'Dispatched' : tr.state) as typeof flow[number]);
    return <div className="registry-page">
        <PageHead title={`${tr.id} · ${t(`type.${tr.type}`)}`} sub={<><Link className="row-link" to={`/animals/${animal.id}`}>{animal.tag}</Link> · {holderLabel(tr.from, store)} → {holderLabel(tr.to, store)}</>}>
            <Badge state={tr.state} />
            {submittable && <button className="workspace-button green" onClick={doSubmit}>{tr.state === 'Returned' ? 'Resubmit' : 'Submit for approval'}</button>}
            {tr.state === 'Received' && !needsAck && canReceive && officer && <button className="workspace-button green" onClick={doComplete}>Complete transfer</button>}
            {actions.map(a => <button key={a.kind} className={`workspace-button ${a.danger ? 'danger' : a.kind === 'approve' ? 'green' : ''}`} onClick={() => { setErrors([]); setDialog(a.kind); }}>{a.label}</button>)}
        </PageHead>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <Errors errors={errors} />
        <div className="steps" aria-label="Progress">{flow.map((s, i) => <span key={s} className={i <= stepIndex ? 'on' : ''}>{t(`state.${s}`)}</span>)}</div>
        {slot && denial && <p className="form-warn">Waiting for the {slot.replaceAll('_', ' ')}. {u.role === slot ? denial : ''}</p>}
        {tr.state === 'Disputed' && <p className="form-warn">The tag or sex read at receipt does not match the transfer record. The sending officer and the District Coordinator are alerted.</p>}
        <div className="two-col">
            <Panel title="Details"><dl className="kv">
                <dt>Animal</dt><dd>{animal.tag} · {animal.breed} · <Badge state={animal.status} /></dd><dt>From</dt><dd>{holderLabel(tr.from, store)} ({nodeMap[tr.from.nodeId]?.name})</dd><dt>To</dt><dd>{holderLabel(tr.to, store)} ({nodeMap[tr.to.nodeId]?.name})</dd>
                <dt>Planned date</dt><dd>{tr.plannedDate}</dd><dt>Reason</dt><dd>{tr.reason}</dd><dt>Created by</dt><dd>{store.users.find(x => x.id === tr.createdBy)?.name}</dd>
                {tr.reversalOf && <><dt>Reverses</dt><dd><Link className="row-link" to={`/transfers/${tr.reversalOf}`}>{tr.reversalOf}</Link></dd></>}
                {crossing && <><dt>Boundary</dt><dd><Badge state="info" label="Crosses a district boundary" /></dd></>}
            </dl></Panel>
            <Panel title="Approvals">
                <ol className="timeline">{tr.chain.map((role, i) => { const a = tr.approvals.filter(x => x.level === i).slice(-1)[0]; return <li key={role + i}>Level {i + 1}: {role.replaceAll('_', ' ')} {a ? <><Badge state={a.decision === 'approve' ? 'Approved' : a.decision === 'return' ? 'Returned' : 'Rejected'} label={a.decision} /> by {store.users.find(x => x.id === a.approverId)?.name}{a.comment && `: “${a.comment}”`}<small>{fmtDateTime(a.ts)}</small></> : <Badge state={i === tr.approvals.filter(x => x.decision === 'approve').length && slot ? 'Submitted' : 'Draft'} label={i === tr.approvals.filter(x => x.decision === 'approve').length && slot ? 'waiting' : 'not reached'} />}</li>; })}</ol>
            </Panel>
        </div>
        <div className="two-col">
            <Panel title="Dispatch and receipt">
                {tr.dispatch ? <dl className="kv"><dt>Dispatched</dt><dd>{fmtDateTime(tr.dispatch.ts)}</dd><dt>Sender</dt><dd>{tr.dispatch.sender} <small>(ID ****{tr.dispatch.senderNid.slice(-4)})</small></dd><dt>Transport</dt><dd>{tr.dispatch.transport || '-'}</dd><dt>Photos</dt><dd>{tr.dispatch.photos.join(', ') || 'none'}</dd></dl> : <p>Not dispatched yet.</p>}
                {tr.receipt && <dl className="kv" style={{ marginTop: 12 }}><dt>Received</dt><dd>{fmtDateTime(tr.receipt.ts)}</dd><dt>Tag read</dt><dd>{tr.receipt.tagRead} {tr.receipt.tagRead === animal.tag ? <Badge state="ok" label="matches" /> : <Badge state="bad" label="does not match" />}</dd><dt>Condition</dt><dd>{tr.receipt.condition}</dd><dt>Remarks</dt><dd>{tr.receipt.remarks || '-'}</dd></dl>}
                {tr.ack && <p className="form-ok" style={{ marginTop: 12 }}>Acknowledged by {tr.ack.method === 'otp' ? 'one-time code' : 'signed paper form'} on {fmtDateTime(tr.ack.ts)} ({tr.ack.device}).</p>}
            </Panel>
            <Panel title="History">
                <ol className="timeline">{tr.history.map((h, i) => <li key={i}><Badge state={h.state} />{h.note && ` ${h.note}`}<small>{fmtDateTime(h.ts)} · {store.users.find(x => x.id === h.by)?.name ?? h.by}</small></li>)}</ol>
            </Panel>
        </div>
        {ledger && <Panel title="Chain ledger entry"><dl className="kv"><dt>Sequence</dt><dd>{ledger.seq}</dd><dt>Hash</dt><dd className="hash">{ledger.hash}</dd><dt>Previous hash</dt><dd className="hash">{ledger.prevHash}</dd></dl></Panel>}
        {dialog && <TransferActionDialog transfer={tr} kind={dialog} onClose={() => setDialog(null)} onDone={m => { setDialog(null); setNotice(m); }} />}
    </div>;
}
