import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, CalendarArrowUp, UserRound, Bell, ChartNoAxesCombined, Settings, LogOut, LifeBuoy, Leaf, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WorkspaceDialog from './WorkspaceDialog';
import LanguageToggle from './LanguageToggle';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [panel, setPanel] = useState<'support' | 'settings' | null>(null);
    const rw = i18n.language === 'rw';
    const items = [
        { icon: Home, label: rw ? 'Ahabanza' : 'Dashboard', path: '/dashboard', roles: ['admin', 'district_officer', 'sector_officer', 'agenti'] },
        { icon: Users, label: rw ? 'Imiryango' : 'Households', path: '/households', roles: ['admin', 'district_officer', 'sector_officer', 'agenti'] },
        { icon: CalendarArrowUp, label: rw ? 'Gutanga inyana' : 'Calf Transfers', path: '/transfers', roles: ['admin', 'district_officer', 'sector_officer', 'agenti'] },
        { icon: UserRound, label: rw ? 'Amatungo' : 'Livestock Registry', path: '/livestock', roles: ['admin', 'district_officer', 'sector_officer', 'agenti'] },
        { icon: Bell, label: rw ? 'Ijwi ry’umuturage' : 'Citizen Voice', path: '/messages', roles: ['admin', 'district_officer', 'sector_officer', 'agenti', 'beneficiary'] },
        { icon: ChartNoAxesCombined, label: rw ? 'Raporo' : 'Reports', path: '/reports', roles: ['admin', 'district_officer', 'sector_officer'] },
        { icon: Users, label: rw ? 'Abakoresha' : 'Users & Roles', path: '/admin', roles: ['admin'] },
        { icon: Leaf, label: rw ? 'Gahunda' : 'HGI Programs', path: '/programs', roles: ['admin', 'district_officer', 'sector_officer'] },
    ];
    return <>
        {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
        <aside className={`workspace-sidebar ${open ? 'is-open' : ''}`}>
            <div className="sidebar-brand"><NavLink to="/dashboard" onClick={onClose}>Isonga Platform</NavLink><span>{user && t(`roles.${user.role}`)}</span><button className="icon-button mobile-sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
            <nav aria-label="Main navigation" className="workspace-nav">{items.filter(item => user && item.roles.includes(user.role)).map(item => <NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => `workspace-nav-link ${isActive ? 'active' : ''}`}><item.icon size={19} strokeWidth={1.25} /><span>{item.label}</span></NavLink>)}</nav>
            <div className="sidebar-bottom">
                <button className="workspace-nav-link" onClick={() => setPanel('support')}><LifeBuoy size={19} strokeWidth={1.5} /><span>{rw ? 'Ubufasha' : 'Support'}</span></button>
                <button className="workspace-nav-link" onClick={() => setPanel('settings')}><Settings size={19} strokeWidth={1.5} /><span>{rw ? 'Igenamiterere' : 'Settings'}</span></button>
                <div className="sidebar-profile"><span className="workspace-avatar">{user?.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><p>{user?.name}</p><span title={user?.email}>{user?.email}</span></div><button className="icon-button logout-button" aria-label="Sign out" onClick={() => { logout(); navigate('/login'); }}><LogOut size={17} /></button></div>
            </div>
        </aside>
        {panel && <WorkspaceDialog title={panel === 'support' ? (rw ? 'Ubufasha' : 'Workspace support') : (rw ? 'Igenamiterere' : 'Workspace settings')} onClose={() => setPanel(null)}>
            {panel === 'support' ? <div className="dialog-body"><p>{rw ? 'Koresha urutonde rw’ibumoso urebe imiryango, amatungo n’inyana zatanzwe.' : 'Use the navigation to manage households, livestock, and calf transfers. Search and filter the registries to find a record, then use the eye icon to view its details.'}</p><p>{rw ? 'Amakuru ni ay’icyitegererezo. Impinduka zirangira iyo wongeye gufungura urupapuro.' : 'This workspace contains fictional demo records. Additions and deletions last until you refresh the page.'}</p></div> : <div className="dialog-body"><p>{rw ? 'Ururimi rw’urubuga' : 'Workspace language'}</p><LanguageToggle /><p>{rw ? 'Konti' : 'Signed in as'}: {user?.name}<br />{user?.email}</p><p>{rw ? 'Amakuru y’icyitegererezo' : 'Demo session · Changes reset on refresh'}</p></div>}
        </WorkspaceDialog>}
    </>;
}
