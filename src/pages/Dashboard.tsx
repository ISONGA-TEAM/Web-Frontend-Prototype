import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Empty } from '../components/ui';
import { can } from '../lib/rules';
import type { WidgetAction } from '../lib/rules';
import OfficialDashboard from './dash/OfficialDashboard';
import VillageDashboard from './dash/VillageDashboard';
import HouseholdDashboard from './dash/HouseholdDashboard';

const groups: Record<'overview' | 'work' | 'mine', WidgetAction[]> = {
    overview: ['widget_kpis', 'widget_map', 'widget_children', 'widget_imihigo', 'widget_pipeline', 'widget_trend', 'widget_stages', 'widget_health', 'widget_approvals', 'widget_alerts'],
    work: ['widget_worklist', 'widget_calving_calendar', 'widget_to_visit'],
    mine: ['widget_my_status', 'widget_my_actions', 'widget_my_animals', 'widget_my_transfers'],
};

/**
 * One dashboard for everyone. It is assembled from widgets, and each widget appears only if the user's effective
 * permissions include it. The System Administrator grants or revokes widgets on the Permissions page.
 */
export default function Dashboard() {
    const { user } = useAuth();
    useStore(); // re-render when permissions change
    const any = (g: keyof typeof groups) => groups[g].some(w => can(user, w));
    const sections = [any('overview') && 'overview', any('work') && 'work', user?.role === 'household' && any('mine') && 'mine'].filter(Boolean) as ('overview' | 'work' | 'mine')[];
    if (!sections.length) return <Empty title="No dashboard widgets are enabled for your account" text="Ask your System Administrator which widgets you should see." />;
    return <>
        {sections.map((g, i) => <section key={g} aria-label={g}>
            {g === 'overview' && <OfficialDashboard />}
            {g === 'work' && <VillageDashboard embedded={i > 0} />}
            {g === 'mine' && <HouseholdDashboard embedded={i > 0} />}
        </section>)}
    </>;
}
