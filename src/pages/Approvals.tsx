import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, PageHead, Panel, fmtDate } from '../components/ui';
import TransferActionDialog from '../components/TransferActions';
import type { ActionKind } from '../components/TransferActions';
import { approvalDenial, daysBetween, holderLabel, pendingSlot } from '../lib/rules';
import type { Transfer } from '../types';

export default function Approvals() {
    const { user } = useAuth();
    const { store, data } = useStore();
    const { t } = useTranslation();
    const [dialog, setDialog] = useState<{ tr: Transfer; kind: ActionKind } | null>(null);
    const [notice, setNotice] = useState('');
    const waiting = data.transfers.filter(tr => pendingSlot(tr));
    const mine = waiting.filter(tr => approvalDenial(user!, tr) === null).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const others = waiting.filter(tr => !mine.includes(tr));
    return <div className="registry-page">
        <PageHead title={t('nav.approvals')} sub="Transfers waiting for you, oldest first. You see the full history before you decide. You cannot approve a transfer you created." />
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <Panel title={`Waiting for you (${mine.length})`}>
            <div className="table-scroll"><table className="data-table"><thead><tr><th>Transfer</th><th>Type</th><th>Animal</th><th>From → To</th><th className="num">Age (days)</th><th>Decision</th></tr></thead><tbody>
                {mine.map(tr => <tr key={tr.id}><td><Link className="row-link" to={`/transfers/${tr.id}`}>{tr.id}</Link></td><td>{t(`type.${tr.type}`)}</td><td>{store.animals.find(a => a.id === tr.animalId)?.tag}</td><td>{holderLabel(tr.from, store)} → {holderLabel(tr.to, store)}</td><td className="num">{daysBetween(tr.createdAt, Date.now())}</td>
                    <td><div className="mini-actions"><button className="workspace-button green small" onClick={() => setDialog({ tr, kind: 'approve' })}>Approve</button><button className="workspace-button small" onClick={() => setDialog({ tr, kind: 'return' })}>Return</button><button className="workspace-button danger small" onClick={() => setDialog({ tr, kind: 'reject' })}>Reject</button></div></td></tr>)}
                {!mine.length && <tr><td colSpan={6}><Empty title="Nothing is waiting for you" /></td></tr>}
            </tbody></table></div>
        </Panel>
        <Panel title={`Waiting for someone else (${others.length})`}>
            <table className="data-table"><tbody>{others.map(tr => <tr key={tr.id}><td><Link className="row-link" to={`/transfers/${tr.id}`}>{tr.id}</Link></td><td>{t(`type.${tr.type}`)}</td><td><Badge state={tr.state} /></td><td>needs {pendingSlot(tr)?.replaceAll('_', ' ')}</td><td>{fmtDate(tr.createdAt)}</td></tr>)}{!others.length && <tr><td>None.</td></tr>}</tbody></table>
        </Panel>
        {dialog && <TransferActionDialog transfer={dialog.tr} kind={dialog.kind} onClose={() => setDialog(null)} onDone={m => { setDialog(null); setNotice(m); }} />}
    </div>;
}
