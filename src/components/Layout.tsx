import { Component, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AssistantWidget from './AssistantWidget';
import { useAuth } from '../context/AuthContext';
import '../workspace.css';
import '../srs.css';

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info.componentStack); }
    render() {
        return this.state.failed
            ? <div className="empty" role="alert"><strong>Something went wrong</strong><p>Reload the page. If it keeps happening, quote the time to the system administrator.</p></div>
            : this.props.children;
    }
}

export default function Layout() {
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        const online = () => setIsOffline(false);
        const offline = () => setIsOffline(true);
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
    }, []);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <div className="workspace-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="workspace-content">
            {isOffline && <div className="workspace-offline"><WifiOff size={16} />{t('common.offline', 'You are offline. The field app would queue records for sync; this prototype keeps working with the data already loaded.')}</div>}
            <Navbar onMenu={() => setMenuOpen(true)} />
            <main className="workspace-main"><Boundary key={pathname}><Outlet /></Boundary></main>
        </div>
        <AssistantWidget />
    </div>;
}
