import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import '../workspace.css';

export default function Layout() {
    const { isAuthenticated } = useAuth();
    const { i18n } = useTranslation();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        const online = () => setIsOffline(false);
        const offline = () => setIsOffline(true);
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
    }, []);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <WorkspaceProvider><div className="workspace-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="workspace-content">
            {isOffline && <div className="workspace-offline"><WifiOff size={16} />{i18n.language === 'rw' ? 'Nta interineti. Amakuru y’icyitegererezo aracyaboneka.' : 'You are offline. Demo records are still available in this session.'}</div>}
            <Navbar onMenu={() => setMenuOpen(true)} />
            <main className="workspace-main"><Outlet /></main>
        </div>
    </div></WorkspaceProvider>;
}
