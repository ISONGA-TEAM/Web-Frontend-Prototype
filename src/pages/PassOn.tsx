import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, Errors, PageHead, Panel, fmtDate } from '../components/ui';
import WorkspaceDialog from '../components/WorkspaceDialog';
import * as E from '../lib/engine';
import { can, hasEverReceived, holdsAny, inScope, passOnColumns, passOnTasks } from '../lib/rules';
import type { PassOnTask, RuleError } from '../lib/rules';
import { descendantsOf, nodeMap } from '../data/hierarchy';

/** Pass-on board: first female calves from task creation to confirmed receipt (REQ-26 to REQ-28). */
export default function PassOn() {
    const { user } = useAuth();
    const { store, data, act, asOf } = useStore();
    const { t } = useTranslation();
    const [nominating, setNominating] = useState<PassOnTask | null>(null);
    const [pick, setPick] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [notice, setNotice] = useState('');
    const tasks = passOnTasks(store, asOf).filter(tk => inScope(user!, tk.holder.nodeId));
    const open = tasks.filter(tk => tk.due || tk.column !== 'Task created');
    const upcoming = tasks.filter(tk => !tk.due && tk.column === 'Task created' && tk.daysUntilDue <= 60);
    const tag = (id: string) => store.animals.find(a => a.id === id)?.tag ?? id;
    const holderName = (tk: PassOnTask) => store.households.find(h => h.id === tk.holder.id)?.headName ?? tk.holder.id;
    // Nominees: eligible, not yet served, in the nominator's jurisdiction, ordered by eligibility date then need. The system never auto-selects.
    const nominees = nominating ? data.households.filter(h => h.status === 'Eligible' && !holdsAny(store, h.id) && !hasEverReceived(store, h.id) && h.id !== nominating.holder.id)
        .sort((a, b) => (a.assessments.at(-1)?.date ?? '').localeCompare(b.assessments.at(-1)?.date ?? '') || b.vulnerability.length - a.vulnerability.length) : [];
    const nominate = () => { const r = act((s, u) => E.nominatePassOn(s, u, nominating!.calfId, pick)); if (!r.ok) setErrors(r.errors); else { setNominating(null); setPick(''); setErrors([]); setNotice('Nominated. The pass-on is now with the Cell Officer for approval.'); } };
    const sevBadge = (tk: PassOnTask) => tk.column === 'Confirmed' ? <Badge state="ok" label={`${tk.ageDays} days`} /> : tk.severity === 'ok' ? <Badge state="ok" label={tk.due ? `${tk.ageDays} days open` : `due in ${tk.daysUntilDue} d`} /> : <Badge state={tk.severity} label={`${tk.ageDays} days · ${tk.severity === 'red' ? 'critical' : 'overdue'}`} />;
    return <div className="registry-page">
        <PageHead title={t('nav.passon')} sub={`The first female calf of a Girinka cow passes to a new eligible household at ${store.config.passOnAgeMonths} months. Amber after ${store.config.passOnAmberDays} days open, red after ${store.config.passOnRedDays}.`} />
        {notice && <p className="form-ok" role="status">{notice}</p>}
        <div className="kanban">{passOnColumns.map(col => { const cards = open.filter(tk => tk.column === col); return <section key={col} className="kanban-col" aria-label={col}>
            <h3>{t(`state.${col}`)} <span>{cards.length}</span></h3>
            {cards.map(tk => <article key={tk.calfId} className={`task-card sev-${tk.severity}`}>
                <strong><Link className="row-link" to={`/animals/${tk.calfId}`}>{tag(tk.calfId)}</Link></strong>
                <span>Dam {tag(tk.damId)} · {holderName(tk)}</span><span>{nodeMap[tk.holder.nodeId]?.name}</span><span>Eligible since {fmtDate(tk.eligibleDate)}</span>{sevBadge(tk)}
                {tk.transfer && <Link className="row-link" to={`/transfers/${tk.transfer.id}`}>{tk.transfer.id} · {tk.transfer.state}</Link>}
                {col === 'Task created' && can(user, 'create_transfer') && user!.role !== 'household' && <button className="workspace-button green small" onClick={() => { setNominating(tk); setErrors([]); }}>Nominate a household</button>}
            </article>)}
            {!cards.length && <p className="registry-demo-note">Nothing here.</p>}
        </section>; })}</div>
        <Panel title={`Reaching pass-on age within 60 days (${upcoming.length})`}>
            <table className="data-table"><tbody>{upcoming.map(tk => <tr key={tk.calfId}><td><Link className="row-link" to={`/animals/${tk.calfId}`}>{tag(tk.calfId)}</Link></td><td>{holderName(tk)}</td><td>{nodeMap[tk.holder.nodeId]?.name}</td><td>eligible {fmtDate(tk.eligibleDate)} (in {tk.daysUntilDue} days)</td></tr>)}{!upcoming.length && <tr><td>None.</td></tr>}</tbody></table>
            <p className="registry-demo-note">Male calves are not subject to pass-on. If a first female calf dies, the next female calf becomes the candidate.</p>
        </Panel>
        {!tasks.length && <Empty title="No pass-on tasks in your jurisdiction" />}
        {nominating && <WorkspaceDialog title={`Nominate a receiver for ${tag(nominating.calfId)}`} onClose={() => setNominating(null)} wide><div className="animal-form">
            <p className="note-box">Eligible households that are not yet served, sorted by eligibility date and then by need. The system does not choose for you; the nomination goes to the Cell Officer and then the Sector Officer.</p>
            <table className="data-table"><tbody>{nominees.map(h => <tr key={h.id}><td><input type="radio" name="nominee" aria-label={h.headName} checked={pick === h.id} onChange={() => setPick(h.id)} /></td><td>{h.headName}</td><td>{nodeMap[h.villageId].name}</td><td>{h.vulnerability.join(', ') || 'no indicators'}</td></tr>)}{!nominees.length && <tr><td>No eligible, unserved household in your jurisdiction. After 14 days the task escalates to the sector.</td></tr>}</tbody></table>
            <Errors errors={errors} /><div className="dialog-actions"><button className="workspace-button" onClick={() => setNominating(null)}>Cancel</button><button className="workspace-button green" disabled={!pick} onClick={nominate}>Nominate</button></div></div></WorkspaceDialog>}
        <p className="registry-demo-note">{t('common.demo')} {descendantsOf('RW', 'village').length} villages in the national tree.</p>
    </div>;
}
