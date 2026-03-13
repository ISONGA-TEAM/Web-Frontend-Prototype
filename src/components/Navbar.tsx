import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from './LanguageToggle';
import { Bell, Search, User as UserIcon } from 'lucide-react';

const Navbar: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full w-96">
                <Search size={18} className="text-slate-400" />
                <input
                    type="text"
                    placeholder={t('common.search') + "..."}
                    className="bg-transparent border-none outline-none text-sm w-full"
                />
            </div>

            <div className="flex items-center gap-6">
                <LanguageToggle />

                <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                        <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                            {user ? t(`roles.${user.role}`) : ''}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <UserIcon size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
