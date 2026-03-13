import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    ArrowRight,
    TrendingUp,
    Leaf,
    Beef as Cow,
    CreditCard,
    Plus,
    Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const HGIPrograms: React.FC = () => {
    const { t } = useTranslation();
    const programs = [
        {
            id: 'GIR-01',
            name: t('registration.programs_list.girinka.name'),
            desc: t('registration.programs_list.girinka.desc'),
            enrollment: 1240,
            budget: 'RWF 85M',
            color: 'bg-emerald-50 text-emerald-600',
            icon: Cow
        },
        {
            id: 'VUP-02',
            name: t('registration.programs_list.vup.name'),
            desc: t('registration.programs_list.vup.desc'),
            enrollment: 3450,
            budget: 'RWF 120M',
            color: 'bg-blue-50 text-blue-600',
            icon: Leaf
        },
        {
            id: 'EJO-03',
            name: t('registration.programs_list.ejo_heza.name'),
            desc: t('registration.programs_list.ejo_heza.desc'),
            enrollment: 5800,
            budget: 'RWF 45M',
            color: 'bg-amber-50 text-amber-600',
            icon: CreditCard
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                        <Building2 className="text-primary" />
                        {t('detail.hgi_status')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('dashboard.hgi_coverage')}</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    {t('admin.add_rule') || 'Add New'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {programs.map((p) => (
                    <div key={p.id} className="card group hover:shadow-xl hover:shadow-primary/5 transition-all">
                        <div className={cn("inline-flex p-4 rounded-2xl mb-6", p.color)}>
                            <p.icon size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed h-20 overflow-hidden line-clamp-3">
                            {p.desc}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('registration.enrolled_count')}</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{p.enrollment}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('registration.allocation')}</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{p.budget}</p>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-3 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all flex items-center justify-center gap-2">
                            {t('registration.manage_program')}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="card bg-white overflow-hidden p-0">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900">{t('reports.sector_performance')}</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={t('registry.search_placeholder')} className="input-field pl-9 h-9 text-sm w-48 bg-slate-50 border-none" />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">{t('registry.table.head_location')}</th>
                                <th className="px-6 py-4">{t('registration.graduation_target')}</th>
                                <th className="px-6 py-4">{t('registration.active_support')}</th>
                                <th className="px-6 py-4">{t('registration.coverage_rate')}</th>
                                <th className="px-6 py-4 text-right">{t('dashboard.registration_trend')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {['Muringa', 'Kabatwa', 'Jenda', 'Bigogwe', 'Rurembo'].map((sector, i) => (
                                <tr key={sector} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900">{sector}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">150 {t('dashboard.kpi_total_households')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-1.5">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white" />
                                            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white" />
                                            <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${85 - i * 5}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{85 - i * 5}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <TrendingUp size={16} className="text-emerald-500 ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HGIPrograms;
