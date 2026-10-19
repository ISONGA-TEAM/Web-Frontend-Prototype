import { Navigate, Route } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './context/AuthContext';
import { useStore } from './context/StoreContext';
import { can, permissionsOf } from './lib/rules';
import type { Action } from './lib/rules';
import type { Grants } from './lib/rules';
import type { Role, User } from './types';
import Dashboard from './pages/Dashboard';
import Households from './pages/Households';
import HouseholdDetail from './pages/HouseholdDetail';
import Selection from './pages/Selection';
import Animals from './pages/Animals';
import AnimalProfile from './pages/AnimalProfile';
import Transfers from './pages/Transfers';
import TransferDetail from './pages/TransferDetail';
import Approvals from './pages/Approvals';
import PassOn from './pages/PassOn';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Grievances from './pages/Grievances';
import Admin from './pages/Admin';
import Audit from './pages/Audit';
import Assistant from './pages/Assistant';
import Permissions from './pages/Permissions';

/** A page opens when the user's effective permissions include `needs`. The System Administrator can grant or revoke it per user. */
export interface AppRoute { path: string; nav?: string; icon?: string; needs: Action; element: ReactElement; sample?: string }
export const appRouteTable: AppRoute[] = [
    { path: '/dashboard', nav: 'dashboard', icon: 'home', needs: 'page_dashboard', element: <Dashboard /> },
    { path: '/households', nav: 'households', icon: 'users', needs: 'page_households', element: <Households /> },
    { path: '/households/:id', needs: 'page_households', element: <HouseholdDetail />, sample: '/households/HH-0001' },
    { path: '/selection', nav: 'selection', icon: 'list', needs: 'page_selection', element: <Selection /> },
    { path: '/animals', nav: 'animals', icon: 'cow', needs: 'page_animals', element: <Animals /> },
    { path: '/animals/:id', needs: 'page_animals', element: <AnimalProfile />, sample: '/animals/AN-0001' },
    { path: '/transfers', nav: 'transfers', icon: 'transfer', needs: 'page_transfers', element: <Transfers /> },
    { path: '/transfers/:id', needs: 'page_transfers', element: <TransferDetail />, sample: '/transfers/TR-0001' },
    { path: '/approvals', nav: 'approvals', icon: 'check', needs: 'page_approvals', element: <Approvals /> },
    { path: '/pass-on', nav: 'passon', icon: 'board', needs: 'page_passon', element: <PassOn /> },
    { path: '/alerts', nav: 'alerts', icon: 'bell', needs: 'page_alerts', element: <Alerts /> },
    { path: '/reports', nav: 'reports', icon: 'chart', needs: 'page_reports', element: <Reports /> },
    { path: '/grievances', nav: 'grievances', icon: 'life', needs: 'page_grievances', element: <Grievances /> },
    { path: '/assistant', nav: 'assistant', icon: 'bot', needs: 'page_assistant', element: <Assistant /> },
    { path: '/permissions', nav: 'permissions', icon: 'key', needs: 'manage_permissions', element: <Permissions /> },
    { path: '/admin', nav: 'admin', icon: 'settings', needs: 'page_admin', element: <Admin /> },
    { path: '/audit', nav: 'audit', icon: 'audit', needs: 'page_audit', element: <Audit /> },
];

function Guard({ needs, children }: { needs: Action; children: ReactElement }) {
    const { user } = useAuth();
    useStore(); // re-render when the System Administrator changes permissions
    return can(user, needs) ? children : <Navigate to="/dashboard" replace />;
}
export const appRoutes = () => appRouteTable.map(r => <Route key={r.path} path={r.path} element={<Guard needs={r.needs}>{r.element}</Guard>} />);
/** Paths a user may open (used by the render checks). */
export const pathsFor = (user: Pick<User, 'id' | 'role'>, grants: Grants = {}) => { const perms = permissionsOf(user as User, grants); return appRouteTable.filter(r => perms.includes(r.needs)).map(r => r.sample ?? r.path); };
export type { Role };
