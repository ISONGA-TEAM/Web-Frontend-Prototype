import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    MapPin,
    CheckCircle2,
    Clock,
    Beef as Cow,
    Leaf,
    CreditCard,
    MessageSquare,
    AlertCircle,
    TrendingUp,
    MoreHorizontal
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const HouseholdDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();

    // Mock data for a single household
    const household = {
        id: id || 'HH-1001',
        headName: 'HABIMANA Jean de Dieu',
        nid: '1198580012345678',
        ubudehe: 1,
        location: {
            district: 'Nyabihu',
            sector: 'Muringa',
            cell: 'Gasiza',
            village: 'Kovu'
        },
        milestones: [
            { step: `Step 1: ${t('registration.steps.basic_info')}`, date: 'Oct 12, 2023', completed: true },
            { step: `Step 2: ${t('registration.steps.hgi_status')}`, date: 'Dec 05, 2023', completed: true },
            { step: `Step 3: ${t('registration.steps.asset_support')}`, date: 'Jan 20, 2024', completed: true },
            { step: `Step 4: ${t('detail.graduation_package')}`, date: 'Pending', completed: false },
            { step: t('common.status_graduated'), date: 'Pending', completed: false }
        ],
        programs: [
            { name: 'Girinka', icon: Cow, status: 'Enrolled', date: 'Dec 05, 2023', color: 'bg-emerald-50 text-emerald-600' },
            { name: 'VUP', icon: Leaf, status: 'Enrolled', date: 'Jan 20, 2024', color: 'bg-blue-50 text-blue-600' },
            { name: 'Ejo Heza', icon: CreditCard, status: 'Pending', date: 'N/A', color: 'bg-amber-50 text-amber-600' },
        ],
        livestock: {
            animalId: 'CW-2045',
            earTag: 'RW-NYA-102',
            lastEvent: 'Vaccination (Foot & Mouth)',
            eventDate: 'Feb 15, 2024',
            status: 'Healthy'
        },
        messages: [
            { sender: 'Agent Marie', text: 'Confirmed receipt of cow feed supplement.', time: '2 days ago' },
            { sender: 'Jean de Dieu', text: 'When is the next vaccination scheduled?', time: '3 days ago' }
        ]
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link to="/households" className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                    <ChevronLeft size={24} />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-display font-bold text-slate-900">{household.headName}</h1>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold ring-1 ring-primary/20">
                            {t('common.ubudehe_class').toUpperCase()} {household.ubudehe}
                        </span>
                    </div>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                        <MapPin size={16} />
                        {household.location.district}, {household.location.sector}, {household.location.cell}, {household.location.village}
                        <span className="mx-2 text-slate-300">|</span>
                        ID: {household.id}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-outline">{t('detail.edit_household')}</button>
                    <button className="btn-primary">{t('detail.approve_graduation')}</button>
                </div>
            </div>

            {/* Graduation Roadmap */}
            <div className="card bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        {t('detail.roadmap')}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('detail.target')}: Dec 2024</span>
                </div>
                <div className="p-8">
                    <div className="relative flex justify-between">
                        {/* Connection Lines */}
                        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-0">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: '50%' }}
                            />
                        </div>

                        {household.milestones.map((m, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center w-32">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors",
                                    m.completed ? "bg-primary text-white" : "bg-white text-slate-300 border-slate-100"
                                )}>
                                    {m.completed ? <CheckCircle2 size={18} /> : (i + 1)}
                                </div>
                                <div className="mt-4 text-center">
                                    <p className={cn("text-xs font-bold", m.completed ? "text-slate-900" : "text-slate-400")}>
                                        {m.step}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">{m.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* HGI Programs */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">{t('detail.hgi_status')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {household.programs.map((p, i) => (
                            <div key={i} className="card hover:shadow-md transition-shadow">
                                <div className={cn("inline-flex p-3 rounded-xl mb-4", p.color)}>
                                    <p.icon size={24} />
                                </div>
                                <h4 className="font-bold text-slate-900">{p.name}</h4>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-400">{t('common.status')}</span>
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded",
                                            p.status === 'Enrolled' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                        )}>{p.status === 'Enrolled' ? t('common.status_enrolled') : t('common.status_pending')}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-400">{t('registration.programs')}</span>
                                        <span className="text-xs font-bold text-slate-700">{p.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Thread */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <MessageSquare size={20} className="text-primary" />
                            {t('detail.comm_thread')}
                        </h3>
                        <div className="space-y-4">
                            {household.messages.map((m, i) => (
                                <div key={i} className={cn(
                                    "max-w-[80%] p-4 rounded-2xl",
                                    m.sender === 'Jean de Dieu' ? "ml-auto bg-slate-50" : "bg-primary/5 border border-primary/10"
                                )}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-primary">{m.sender}</span>
                                        <span className="text-[10px] text-slate-400">{m.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{m.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-50 flex gap-4">
                            <input
                                type="text"
                                placeholder="..."
                                className="input-field bg-slate-50 border-none"
                            />
                            <button className="btn-primary px-6">{t('common.submit')}</button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="card bg-primary text-white border-none shadow-xl shadow-primary/20">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">{t('detail.livestock_log')}</h3>
                            <Cow size={24} className="text-accent" />
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white/10 p-4 rounded-xl">
                                <p className="text-xs font-medium text-white/60">{t('detail.livestock_log')}</p>
                                <p className="font-bold text-lg">{household.livestock.animalId}</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">TAG: {household.livestock.earTag}</p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-white/60 uppercase">{t('livestock.last_event')}</p>
                                        <p className="text-xs font-bold">{household.livestock.lastEvent}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-white/60 uppercase">{t('common.status')}</p>
                                        <p className="text-xs font-bold text-accent">{t('livestock.healthy')}</p>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors mt-4">
                                {t('detail.log_health_event')}
                            </button>
                        </div>
                    </div>

                    <div className="card bg-amber-50 border-amber-100">
                        <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2">
                            <AlertCircle size={16} />
                            {t('detail.nida_integration')}
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            {t('detail.nida_desc')} <strong>Feb 12, 2024</strong>.
                        </p>
                        <button className="mt-3 text-xs font-bold text-amber-900 border-b border-amber-900/20 hover:border-amber-900 transition-all pb-0.5">
                            {t('detail.force_reverify')}
                        </button>
                    </div>

                    <div className="card text-center py-8 bg-slate-50 border-none">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <MoreHorizontal size={20} className="text-slate-400" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{t('detail.audit_trail')}</h4>
                        <p className="text-xs text-slate-500 mt-2">
                            {t('detail.last_edited_by')} <strong>Officer Silas</strong><br />
                            March 12 at 14:30 CAT
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HouseholdDetail;
