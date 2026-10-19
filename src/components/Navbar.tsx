import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { alertsFor, can } from '../lib/rules';
import WorkspaceDialog from './WorkspaceDialog';
import LanguageToggle from './LanguageToggle';
import { Badge } from './ui';
import { appRouteTable } from '../routes';

export default function Navbar({ onMenu }: { onMenu: () => void }) {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const { store } = useStore();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const unresolved = user ? alertsFor(store, user).filter(a => (a.state?.status ?? 'New') !== 'Resolved') : [];
    const fresh = unresolved.filter(a => !a.state);
    const section = pathname.split('/')[1];
    const route = appRouteTable.find(r => r.path.split('/')[1] === section && r.nav);
    const title = route ? t(`nav.${route.nav === 'dashboard' && user?.role === 'household' ? 'mine' : route.nav}`) : 'Isonga Girinka';
    return <header className="workspace-header">
        <div className="header-title"><button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></button><span>{title}</span></div>
        <div className="header-actions">
            <LanguageToggle />
            {can(user, 'page_alerts') && <button className="icon-button notification-button" onClick={() => setOpen(true)} aria-label={`${fresh.length} new alerts`}><Bell size={19} strokeWidth={1.4} />{fresh.length > 0 && <span>{Math.min(fresh.length, 99)}</span>}</button>}
            <span className="workspace-avatar" title={user?.name}>{user?.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
        </div>
        {open && <WorkspaceDialog title="Alerts in your jurisdiction" onClose={() => setOpen(false)}><div className="notification-list">
            {unresolved.slice(0, 8).map(a => <Link key={a.id} to={a.link} onClick={() => setOpen(false)}><strong>{a.rule} <Badge state={a.severity} label={a.severity} /></strong><span>{a.text}</span></Link>)}
            {!unresolved.length && <p>No open alerts.</p>}
            <Link to="/alerts" onClick={() => setOpen(false)}><strong>Open the alerts centre</strong></Link>
        </div></WorkspaceDialog>}
    </header>;
}
