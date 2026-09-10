import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Menu, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { demoAlerts } from '../data/workspace';
import WorkspaceDialog from './WorkspaceDialog';

export default function Navbar({ onMenu }: { onMenu: () => void }) {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const [notifications, setNotifications] = useState(false);
    const rw = i18n.language === 'rw';
    const labels: Record<string, string> = rw ? { dashboard: 'Ahabanza', households: 'Imiryango', transfers: 'Gutanga inyana', livestock: 'Amatungo', messages: 'Ijwi ry’umuturage', reports: 'Raporo', admin: 'Abakoresha', programs: 'Gahunda' } : { dashboard: 'Dashboard', households: 'Households', transfers: 'Calf Transfers', livestock: 'Livestock', messages: 'Citizen Voice', reports: 'Reports', admin: 'Users & Roles', programs: 'HGI Programs' };
    return <header className="workspace-header">
        <div className="header-title"><button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></button><span>{labels[pathname.split('/')[1]] || 'Isonga'}</span></div>
        <div className="header-actions"><Link to="/messages" className="icon-button message-button" aria-label={rw ? 'Ubutumwa' : 'Citizen messages'}><MessageCircle size={19} strokeWidth={1.25} /></Link><button className="icon-button notification-button" onClick={() => setNotifications(true)} aria-label={rw ? 'Amakuru mashya' : `${demoAlerts.length} recent alerts`}><Bell size={19} strokeWidth={1.4} /><span>{demoAlerts.length}</span></button><span className="workspace-avatar" title={user?.name}>{user?.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span></div>
        {notifications && <WorkspaceDialog title={rw ? 'Amakuru mashya' : 'Recent alerts'} onClose={() => setNotifications(false)}><div className="notification-list">{demoAlerts.map(alert => <Link key={alert.id} to={alert.path} onClick={() => setNotifications(false)}><strong>{alert.name}</strong><span>{alert.text}</span><small>{alert.date}</small></Link>)}</div></WorkspaceDialog>}
    </header>;
}
