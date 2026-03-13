import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Beef as Cow,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    Clock,
    ArrowRight,
    Activity,
    Heart,
    Skull
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const LivestockMonitoring: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const stats = [
        { title: t('livestock.stats.total_animals'), value: '1,245', icon: Cow, color: 'text-primary', bg: 'bg-primary/5' },
        { title: t('livestock.stats.health_alerts'), value: '8', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        { title: t('livestock.stats.vaccination'), value: '42', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: t('livestock.mortality_month'), value: '2', icon: Skull, color: 'text-slate-600', bg: 'bg-slate-100' },
    ];

    const events = [
        { id: 'EV-101', animalId: 'RW-NYA-102', household: 'HABIMANA Jean', type: 'Vaccination', date: 'Mar 12, 2024', loggedBy: 'Vet Silas', status: 'completed' },
        { id: 'EV-102', animalId: 'RW-NYA-450', household: 'UWIMANA Marie', type: 'Illness', date: 'Mar 11, 2024', loggedBy: 'Agent Marie', status: 'pending' },
        { id: 'EV-103', animalId: 'RW-NYA-289', household: 'MUGABO David', type: 'Recovery', date: 'Mar 10, 2024', loggedBy: 'Vet Silas', status: 'completed' },
        { id: 'EV-104', animalId: 'RW-NYA-812', household: 'INGABIRE Alice', type: 'Calving', date: 'Mar 08, 2024', loggedBy: 'Agent Marie', status: 'completed' },
        { id: 'EV-105', animalId: 'RW-NYA-334', household: 'GAKWAYA Silas', type: 'Mortality', date: 'Mar 05, 2024', loggedBy: 'Vet Silas', status: 'completed' },
    ];

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            Vaccination: 'bg-emerald-50 text-emerald-600',
            Illness: 'bg-red-50 text-red-600',
            Recovery: 'bg-blue-50 text-blue-600',
            Calving: 'bg-purple-50 text-purple-600',
            Mortality: 'bg-slate-900 text-white',
        };
        return (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", styles[type])}>
                {t(`livestock.${type.toLowerCase()}`) || type}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                        <Cow className="text-primary" />
                        {t('livestock.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('livestock.subtitle')}</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    {t('detail.log_health_event')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="card">
                        <div className="flex items-start justify-between">
                            <div className={cn("p-3 rounded-xl", s.bg)}>
                                <s.icon size={22} className={s.color} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900">{t('livestock.recent_events')}</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                className="input-field pl-9 h-9 text-sm w-64 bg-slate-50 border-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">{t('registry.table.head_name')}</th>
                                <th className="px-6 py-4">{t('detail.livestock_log')}</th>
                                <th className="px-6 py-4">{t('common.status')}</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.map((e) => (
                                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900 font-mono tracking-tight">{e.animalId}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-700">{e.household}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getTypeBadge(e.type)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                        {e.date}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                        {e.loggedBy}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                e.status === 'completed' ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                            )} />
                                            <span className="text-[10px] font-bold uppercase text-slate-400">{e.status === 'completed' ? t('common.status_completed') : t('common.status_pending')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-300 hover:text-primary transition-colors">
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
                    <button className="text-sm font-bold text-primary hover:underline">Download Monthly Health Report (PDF)</button>
                </div>
            </div>

            {/* Alert Banner for Mortality */}
            <div className="p-4 bg-red-900 text-white rounded-2xl flex items-center gap-4 shadow-lg shadow-red-900/20">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                    <h4 className="font-bold">{t('livestock.health_urgent_alert')}</h4>
                    <p className="text-sm text-red-100 opacity-80">{t('livestock.health_urgent_alert_desc')}</p>
                </div>
                <button className="ml-auto px-4 py-2 bg-white text-red-900 rounded-lg font-bold text-xs">{t('livestock.acknowledge')}</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Heart size={20} className="text-red-500" />
                        {t('livestock.stats.vaccination')}
                    </h3>
                    <div className="space-y-6">
                        {['FMD', 'Anthrax', 'LSD'].map((v, i) => (
                            <div key={v}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-slate-700">{v} Vaccination</span>
                                    <span className="font-bold text-primary">{92 - i * 5}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${92 - i * 5}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-primary" />
                        {t('livestock.coverage_by_sector') || 'Active Alerts by Sector'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {['Muringa', 'Kabatwa', 'Jenda', 'Bigogwe'].map((s, i) => (
                            <div key={s} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">{s}</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                    i === 0 ? "bg-red-50 text-red-600" : "bg-slate-200 text-slate-500"
                                )}>{i === 0 ? '3 Alerts' : '0 Alerts'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LivestockMonitoring;
