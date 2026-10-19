import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, ListChecks, Beef, ArrowRightLeft, CheckSquare, Columns3, Bell, ChartNoAxesCombined, LifeBuoy, Settings, ScrollText, ShieldCheck, Bot, KeyRound, LogOut, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import WorkspaceDialog from './WorkspaceDialog';
import LanguageToggle from './LanguageToggle';
import Logo from './Logo';
import { appRouteTable } from '../routes';
import { can } from '../lib/rules';
import { nodeName } from '../lib/metrics';

const icons: Record<string, LucideIcon> = { home: Home, users: Users, list: ListChecks, cow: Beef, transfer: ArrowRightLeft, check: CheckSquare, board: Columns3, bell: Bell, chart: ChartNoAxesCombined, life: LifeBuoy, settings: ShieldCheck, audit: ScrollText, bot: Bot, key: KeyRound };

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user, logout } = useAuth();
    const { reset } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [panel, setPanel] = useState<'support' | 'settings' | null>(null);
    const items = appRouteTable.filter(r => r.nav && can(user, r.needs));
    return <>
        {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
        <aside className={`workspace-sidebar ${open ? 'is-open' : ''}`}>
            <div className="sidebar-brand"><NavLink to="/dashboard" onClick={onClose} aria-label="Isonga"><Logo size={30} /></NavLink><span>{user && t(`roles.${user.role}`)} · {user && nodeName(user.nodeId)}</span><button className="icon-button mobile-sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
            <nav aria-label="Main navigation" className="workspace-nav">{items.map(item => {
                const Icon = icons[item.icon ?? 'home'];
                const key = item.nav === 'dashboard' && user?.role === 'household' ? 'mine' : item.nav!;
                return <NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => `workspace-nav-link ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.25} /><span>{t(`nav.${key}`)}</span></NavLink>;
            })}</nav>
            <div className="sidebar-bottom">
                <button className="workspace-nav-link" onClick={() => setPanel('support')}><LifeBuoy size={19} strokeWidth={1.5} /><span>{t('nav.support')}</span></button>
                <button className="workspace-nav-link" onClick={() => setPanel('settings')}><Settings size={19} strokeWidth={1.5} /><span>{t('nav.settings')}</span></button>
                <div className="sidebar-profile"><span className="workspace-avatar">{user?.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><p>{user?.name}</p><span title={user?.email}>{user?.email}</span></div><button className="icon-button logout-button" aria-label="Sign out" onClick={() => { logout(); navigate('/login'); }}><LogOut size={17} /></button></div>
            </div>
        </aside>
        {panel && <WorkspaceDialog title={panel === 'support' ? t('nav.support') : t('nav.settings')} onClose={() => setPanel(null)}>
            {panel === 'support'
                ? <div className="dialog-body"><p>Use the navigation to move through the Girinka lifecycle: households, selection lists, cattle, transfers, approvals and the pass-on board. Every list is filtered to your jurisdiction.</p><p>{t('common.demo')}</p></div>
                : <div className="dialog-body"><p>{t('common.language')}</p><LanguageToggle /><p>Signed in as {user?.name}<br />{user?.email}</p><p>{t('common.demo')}</p><button className="workspace-button" onClick={() => { reset(); setPanel(null); }}>Reset demo data</button></div>}
        </WorkspaceDialog>}
    </>;
}
