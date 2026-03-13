import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Leaf,
    Beef as Cow,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'rw' : 'en';
        i18n.changeLanguage(nextLang);
    };

    const menuItems = [
        { icon: LayoutDashboard, label: t('dashboard.title'), path: '/dashboard', roles: ['admin', 'district_officer', 'sector_officer', 'agenti'] },
        { icon: Users, label: t('registry.title'), path: '/households', roles: ['admin', 'district_officer', 'sector_officer', 'agenti'] },
        { icon: Leaf, label: t('detail.hgi_status'), path: '/programs', roles: ['admin', 'district_officer', 'sector_officer'] },
        { icon: Cow, label: t('livestock.title'), path: '/livestock', roles: ['admin', 'district_officer', 'sector_officer', 'agenti'] },
        { icon: MessageSquare, label: t('messages.title'), path: '/messages', roles: ['admin', 'district_officer', 'sector_officer', 'agenti', 'beneficiary'] },
        { icon: BarChart3, label: t('reports.title'), path: '/reports', roles: ['admin', 'district_officer', 'sector_officer'] },
        { icon: Settings, label: t('admin.title'), path: '/admin', roles: ['admin'] },
    ];

    const filteredItems = menuItems.filter(item =>
        !user || item.roles.includes(user.role)
    );

    return (
        <div className={cn(
            "h-screen bg-primary text-white transition-all duration-300 flex flex-col relative",
            collapsed ? "w-20" : "w-64"
        )}>
            <div className="p-6 flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                    <ShieldCheck size={24} className="text-accent" />
                </div>
                {!collapsed && <span className="text-xl font-bold font-display tracking-tight">Isonga</span>}
            </div>

            <nav className="flex-1 mt-6 px-3 space-y-2">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-white/10",
                            isActive && "bg-accent text-primary font-bold shadow-lg"
                        )}
                    >
                        <item.icon size={22} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-white/10 transition-all border border-white/5"
                >
                    <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                        {i18n.language.toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-xs font-bold">{i18n.language === 'en' ? 'EN / RW' : 'RW / EN'}</span>
                            <span className="text-[10px] opacity-60 mt-0.5">{i18n.language === 'en' ? 'Switch to Kinyarwanda' : 'Hindura mu Cyongereza'}</span>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    className="flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-red-500/20 text-red-200 transition-all"
                >
                    <LogOut size={22} />
                    {!collapsed && <span>{t('common.logout') || 'Logout'}</span>}
                </button>
            </div>

            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 bg-accent text-primary p-1 rounded-full shadow-lg border-2 border-primary"
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Coat of Arms Watermark */}
            {!collapsed && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/1200px-Coat_of_arms_of_Rwanda.svg.png"
                        alt="Coat of arms"
                        className="w-32"
                    />
                </div>
            )}
        </div>
    );
};

export default Sidebar;
