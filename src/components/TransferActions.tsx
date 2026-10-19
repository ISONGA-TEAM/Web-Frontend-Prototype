// Dialogs for each step of a transfer: approve/return/reject, dispatch, receipt, acknowledgment, cancel, reverse, resolve.
import { useState } from 'react';
import type { ReactNode } from 'react';
import WorkspaceDialog from './WorkspaceDialog';
import { Errors, Field } from './ui';
import { useStore } from '../context/StoreContext';
import * as E from '../lib/engine';
import type { Result } from '../lib/engine';
import type { RuleError } from '../lib/rules';
import type { Store, Transfer, User } from '../types';

export type ActionKind = 'approve' | 'return' | 'reject' | 'dispatch' | 'receipt' | 'ack_otp' | 'ack_paper' | 'cancel' | 'reverse' | 'resolve_accept' | 'resolve_cancel';
interface Props { transfer: Transfer; kind: ActionKind; onClose: () => void; onDone: (message: string) => void }

function Box({ title, onClose, submit, danger, errors, onSubmit, children }: { title: string; onClose: () => void; submit: string; danger?: boolean; errors: RuleError[]; onSubmit: () => void; children: ReactNode }) {
    return <WorkspaceDialog title={title} onClose={onClose}><form className="animal-form" onSubmit={e => { e.preventDefault(); onSubmit(); }} noValidate>{children}<Errors errors={errors} /><div className="dialog-actions"><button type="button" className="workspace-button" onClick={onClose}>Cancel</button><button className={`workspace-button ${danger ? 'danger' : 'green'}`}>{submit}</button></div></form></WorkspaceDialog>;
}

export default function TransferActionDialog({ transfer, kind, onClose, onDone }: Props) {
    const { act, store } = useStore();
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [text, setText] = useState('');
    const [sender, setSender] = useState(''); const [nid, setNid] = useState(''); const [transport, setTransport] = useState(''); const [photos, setPhotos] = useState('');
    const [tag, setTag] = useState(''); const [sex, setSex] = useState('Female'); const [cond, setCond] = useState<'good' | 'fair' | 'poor'>('good');
    const animal = store.animals.find(a => a.id === transfer.animalId)!;
    const run = (fn: (s: Store, u: User) => Result, message: string) => { const r = act(fn); if (!r.ok) setErrors(r.errors); else onDone(message); };
    const id = transfer.id;
    switch (kind) {
        case 'approve': case 'return': case 'reject': {
            const titles = { approve: 'Approve this transfer', return: 'Return to the initiator', reject: 'Reject this transfer' } as const;
            return <Box title={`${titles[kind]} (${id})`} onClose={onClose} submit={kind === 'approve' ? 'Approve' : kind === 'return' ? 'Return' : 'Reject'} danger={kind !== 'approve'} errors={errors} onSubmit={() => run((s, u) => E.decideTransfer(s, u, id, kind, text), kind === 'approve' ? 'Approved.' : kind === 'return' ? 'Returned to the initiator.' : 'Rejected.')}>
                <p className="registry-demo-note">{animal.tag} · each approval records you, the time and your comment, and cannot be altered.</p>
                <Field label={kind === 'approve' ? 'Comment (optional)' : 'Reason'} required={kind !== 'approve'}><textarea value={text} onChange={e => setText(e.target.value)} /></Field></Box>;
        }
        case 'dispatch':
            return <Box title={`Record dispatch (${id})`} onClose={onClose} submit="Confirm dispatch" errors={errors} onSubmit={() => run((s, u) => E.dispatchTransfer(s, u, id, { sender, senderNid: nid, transport, photos: photos.split(',').map(x => x.trim()).filter(Boolean), gps: '' }), 'Dispatched. The animal is now in transit.')}>
                <p className="registry-demo-note">Date and time are recorded automatically. In the field app, photos are time-stamped by the device with GPS when permitted; here you list file names.</p>
                <Field label="Sender name" required><input value={sender} onChange={e => setSender(e.target.value)} /></Field>
                <Field label="Sender national ID reference" required hint="16 digits"><input value={nid} onChange={e => setNid(e.target.value)} inputMode="numeric" maxLength={16} /></Field>
                <Field label="Transport details"><input value={transport} onChange={e => setTransport(e.target.value)} /></Field>
                <Field label="Photos with the tag visible (up to 3, comma separated)"><input value={photos} onChange={e => setPhotos(e.target.value)} placeholder="tag-1.jpg, side.jpg" /></Field></Box>;
        case 'receipt':
            return <Box title={`Confirm receipt (${id})`} onClose={onClose} submit="Confirm receipt" errors={errors} onSubmit={() => run((s, u) => E.receiveTransfer(s, u, id, { tagRead: tag, sex, condition: cond, remarks: text }), 'Receipt recorded. If the tag or sex did not match, the transfer moved to Disputed.')}>
                <p className="registry-demo-note">Read the tag on the animal itself. A mismatch moves the transfer to Disputed and alerts the sender and the District Coordinator.</p>
                <Field label="Tag number read" required><input value={tag} onChange={e => setTag(e.target.value)} /></Field>
                <Field label="Sex"><select value={sex} onChange={e => setSex(e.target.value)}><option>Female</option><option>Male</option></select></Field>
                <Field label="Visible condition"><select value={cond} onChange={e => setCond(e.target.value as 'good')}><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></Field>
                <Field label="Remarks"><textarea value={text} onChange={e => setText(e.target.value)} /></Field></Box>;
        case 'ack_otp':
            return <Box title={`Digital acknowledgment (${id})`} onClose={onClose} submit="Confirm and complete" errors={errors} onSubmit={() => run((s, u) => E.acknowledgeTransfer(s, u, id, 'otp', text, 'Web app'), 'Acknowledged. The transfer is complete and the ledger entry was written.')}>
                <p className="note-box">A one-time code is sent to the receiving household’s registered phone. Demo SMS: <span className="otp-box">{E.otpFor(transfer)}</span></p>
                <Field label="One-time code" required><input value={text} onChange={e => setText(e.target.value)} inputMode="numeric" maxLength={6} /></Field></Box>;
        case 'ack_paper':
            return <Box title={`Paper acknowledgment (${id})`} onClose={onClose} submit="Attach and complete" errors={errors} onSubmit={() => run((s, u) => E.acknowledgeTransfer(s, u, id, 'paper', text, 'Web app'), 'Paper acknowledgment attached. The transfer is complete.')}>
                <p className="registry-demo-note">For a household head who cannot use a phone. The Cell Officer witnesses a signed paper form, scans it and attaches it.</p>
                <Field label="Scanned file name" required><input value={text} onChange={e => setText(e.target.value)} placeholder="ack-scan.pdf" /></Field></Box>;
        case 'cancel':
            return <Box title={`Cancel ${id}`} onClose={onClose} submit="Cancel transfer" danger errors={errors} onSubmit={() => run((s, u) => E.cancelTransfer(s, u, id, text), 'Transfer cancelled.')}><Field label="Reason" required><textarea value={text} onChange={e => setText(e.target.value)} /></Field></Box>;
        case 'reverse':
            return <Box title={`Reverse ${id}`} onClose={onClose} submit="Create reversing transfer" danger errors={errors} onSubmit={() => run((s, u) => E.reverseTransfer(s, u, id, text), 'A reversing transfer was created. It follows the same approval steps and does not change the original record.')}><p className="registry-demo-note">District Coordinators can reverse within 30 days of completion; after that only the Provincial Officer can.</p><Field label="Reason" required><textarea value={text} onChange={e => setText(e.target.value)} /></Field></Box>;
        case 'resolve_accept': case 'resolve_cancel':
            return <Box title={`Resolve dispute (${id})`} onClose={onClose} submit={kind === 'resolve_accept' ? 'Accept as received' : 'Cancel transfer'} danger={kind === 'resolve_cancel'} errors={errors} onSubmit={() => run((s, u) => E.resolveDispute(s, u, id, kind === 'resolve_accept' ? 'accept' : 'cancel', text), 'Dispute resolved.')}><Field label="How was it resolved?" required><textarea value={text} onChange={e => setText(e.target.value)} /></Field></Box>;
    }
}
