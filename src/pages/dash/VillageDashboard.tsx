import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock, HeartPulse, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Badge, Kpi, PageHead, Panel, fmtDate } from '../../components/ui';
import { RecordCalvingDialog, RecordHealthDialog, RegisterHouseholdDialog } from '../../components/forms';
import { can, computeAlerts, daysBetween, holdsAny, passOnTasks } from '../../lib/rules';
import { isWithin, nodeMap } from '../../data/hierarchy';

const GESTATION_DAYS = 283;

export default function VillageDashboard({ embedded = false }: { embedded?: boolean }) {
    const { user } = useAuth();
    const { store, data, asOf } = useStore();
    const { t } = useTranslation();
    const [dialog, setDialog] = useState<'household' | 'calving' | 'health' | null>(null);
    const [notice, setNotice] = useState('');
    const node = user!.nodeId;
    const receipts = data.transfers.filter(tr => tr.state === 'Dispatched' && isWithin(tr.to.nodeId, node));
    const tasks = passOnTasks(store, asOf).filter(tk => isWithin(tk.holder.nodeId, node) && tk.column !== 'Confirmed' && (tk.due || tk.daysUntilDue <= 30));
    const vax = computeAlerts(store, asOf).filter(a => a.rule === 'Vaccination due' && isWithin(a.nodeId, node));
    const calendar = data.animals.filter(a => a.status === 'Pregnant' && a.pregnancyCheck).map(a => ({ a, due: new Date(new Date(a.pregnancyCheck!).getTime() + GESTATION_DAYS * 86_400_000) }))
        .filter(x => daysBetween(asOf, x.due.toISOString()) <= 30).sort((x, y) => x.due.getTime() - y.due.getTime());
    const toVisit = data.households.filter(h => holdsAny(store, h.id) && !store.visits.some(v => v.householdId === h.id && daysBetween(v.date, asOf) <= store.config.visitIntervalDays));
    const untagged = data.animals.filter(a => a.tag.startsWith('UNTAGGED'));
    const done = (m: string) => { setDialog(null); setNotice(m); };
    return <div className="overview-page">
        {embedded ? <h2 style={{ margin: '24px 0 12px', fontSize: 14 }}>{t('dash.village')}</h2> : null}
        {!embedded && <PageHead title={t('dash.village')} sub={`${nodeMap[node].name} · ${user!.name}`}>
            {can(user, 'nominate_household') && <button className="workspace-button green" onClick={() => setDialog('household')}><UserPlus size={15} />Register household</button>}
            {can(user, 'record_event') && <button className="workspace-button" onClick={() => setDialog('calving')}><Plus size={15} />Register calving</button>}
            {can(user, 'record_event') && <button className="workspace-button" onClick={() => setDialog('health')}><HeartPulse size={15} />Record health event</button>}
        </PageHead>}
        {notice && <p className="form-ok" role="status">{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss">x</button></p>}
        {can(user, 'widget_worklist') && <div className="kpi-grid">
            {can(user, 'page_transfers') && <Kpi label="Receipts to confirm" value={receipts.length} tone="blue" to="/transfers" />}
            {can(user, 'page_passon') && <Kpi label="Pass-on tasks" value={tasks.length} to="/pass-on" note={`${tasks.filter(x => x.severity !== 'ok').length} overdue`} />}
            <Kpi label="Vaccinations due" value={vax.length} tone="yellow" />
            <Kpi label="Calvings in 30 days" value={calendar.length} note="Estimates" tone="green" />
        </div>}
        <div className="two-col">
            {can(user, 'widget_worklist') && <Panel title="My worklist">
                {receipts.map(tr => <p key={tr.id}><Badge state="Dispatched" /> <Link className="row-link" to={`/transfers/${tr.id}`}>Confirm receipt of {store.animals.find(a => a.id === tr.animalId)?.tag}</Link></p>)}
                {tasks.map(tk => <p key={tk.calfId}><Badge state={tk.severity === 'ok' ? 'ok' : tk.severity} label={tk.due ? tk.column : `due in ${tk.daysUntilDue} d`} /> <Link className="row-link" to="/pass-on">Pass-on of {store.animals.find(a => a.id === tk.calfId)?.tag}</Link></p>)}
                {vax.map(a => <p key={a.id}><Badge state="info" label="vaccination" /> <Link className="row-link" to={a.link}>{a.text}</Link></p>)}
                {untagged.map(a => <p key={a.id}><Badge state="warning" label="tag" /> <Link className="row-link" to={`/animals/${a.id}`}>Fit a tag to the calf born {fmtDate(a.dob)}</Link></p>)}
                {!receipts.length && !tasks.length && !vax.length && !untagged.length && <p>Nothing is waiting for you today.</p>}
            </Panel>}
            {can(user, 'widget_calving_calendar') && <Panel title="Calving calendar (next 30 days, estimates)" aside={<CalendarClock size={16} aria-hidden="true" />}>
                {calendar.map(({ a, due }) => <p key={a.id}><Link className="row-link" to={`/animals/${a.id}`}>{a.tag}</Link> expected around <b>{fmtDate(due.toISOString())}</b> <Badge state="info" label="estimate" /></p>)}
                {!calendar.length && <p>No calvings expected in the next 30 days.</p>}
                <p className="registry-demo-note">Estimated from the last recorded service date plus {GESTATION_DAYS} days. Updated when a pregnancy check or calving is recorded.</p>
            </Panel>}
        </div>
        {can(user, 'widget_to_visit') && <Panel title={`Households to visit (${toVisit.length})`}>
            <table className="data-table"><tbody>{toVisit.map(h => <tr key={h.id}><td><Link className="row-link" to={`/households/${h.id}`}>{h.headName}</Link></td><td>{nodeMap[h.villageId].name}</td><td>No visit in {store.config.visitIntervalDays} days</td></tr>)}{!toVisit.length && <tr><td>All served households were visited recently.</td></tr>}</tbody></table>
        </Panel>}
        {dialog === 'household' && <RegisterHouseholdDialog onClose={() => setDialog(null)} onDone={done} />}
        {dialog === 'calving' && <RecordCalvingDialog onClose={() => setDialog(null)} onDone={done} />}
        {dialog === 'health' && <RecordHealthDialog onClose={() => setDialog(null)} onDone={done} />}
        <p className="registry-demo-note">{t('common.demo')}</p>
    </div>;
}
