import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Empty, Errors, Field, PageHead, Panel, fmtDate } from '../components/ui';
import WorkspaceDialog from '../components/WorkspaceDialog';
import * as E from '../lib/engine';
import { daysBetween } from '../lib/rules';
import type { RuleError } from '../lib/rules';
import { nodeMap } from '../data/hierarchy';
import type { Grievance } from '../types';

export default function Grievances() {
    const { user } = useAuth();
    const { store, data, act, asOf } = useStore();
    const { t } = useTranslation();
    const [closing, setClosing] = useState<Grievance | null>(null);
    const [outcome, setOutcome] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const staff = user!.role !== 'household';
    const update = (g: Grievance, status: 'Acknowledged' | 'Closed') => { const r = act((s, u) => E.updateGrievance(s, u, g.id, status, outcome)); if (!r.ok) setErrors(r.errors); else { setClosing(null); setOutcome(''); setErrors([]); } };
    const rows = data.grievances.slice().sort((a, b) => a.raisedOn.localeCompare(b.raisedOn));
    return <div className="registry-page">
        <PageHead title={t('nav.grievances')} sub="A grievance goes to the level above the officer concerned, is acknowledged within 3 working days and closed with a written outcome. After 30 days it escalates to the Provincial Officer." />
        <Errors errors={errors} />
        {rows.map(g => { const age = daysBetween(g.raisedOn, asOf); const escalated = g.status !== 'Closed' && age > 30; return <Panel key={g.id} title={`${g.id} · ${g.category.replace('_', ' ')}`} aside={<span><Badge state={g.status} /> {escalated && <Badge state="red" label="escalated to Province" />}</span>}>
            <p>{g.text}</p>
            <p className="registry-demo-note">Raised {fmtDate(g.raisedOn)} ({age} days) · {staff ? `${store.households.find(h => h.id === g.householdId)?.headName ?? g.householdId} · ${nodeMap[g.nodeId]?.name} · ` : ''}routed to {g.routedToRole.replaceAll('_', ' ')}{g.outcome ? ` · outcome: ${g.outcome}` : ''}</p>
            {staff && g.status !== 'Closed' && <div className="mini-actions">{g.status === 'Open' && <button className="workspace-button small" onClick={() => update(g, 'Acknowledged')}>Acknowledge</button>}<button className="workspace-button green small" onClick={() => { setClosing(g); setErrors([]); }}>Close with outcome</button></div>}
        </Panel>; })}
        {!rows.length && <Empty title="No grievances" text={staff ? 'None in your jurisdiction.' : 'You can raise one from your Girinka page.'} />}
        {closing && <WorkspaceDialog title={`Close ${closing.id}`} onClose={() => setClosing(null)}><div className="animal-form"><Field label="Written outcome" required><textarea value={outcome} onChange={e => setOutcome(e.target.value)} /></Field><Errors errors={errors} /><div className="dialog-actions"><button className="workspace-button" onClick={() => setClosing(null)}>Cancel</button><button className="workspace-button green" onClick={() => update(closing, 'Closed')}>Close grievance</button></div></div></WorkspaceDialog>}
    </div>;
}
