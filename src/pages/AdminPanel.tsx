import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Shield,
    UserPlus,
    Trash2,
    Edit,
    Settings2,
    Activity,
    Database,
    History,
    CheckCircle2,
    XCircle,
    Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const AdminPanel: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'system'>('users');

    const users = [
        { id: 1, name: 'Jean de Dieu Habimana', email: 'jean.habimana@gov.rw', role: 'District Officer', lastLogin: '10 mins ago', status: 'active' },
        { id: 2, name: 'Marie UWIMANA', email: 'marie.u@gov.rw', role: 'Agenti', lastLogin: '2 hours ago', status: 'active' },
        { id: 3, name: 'Silas GAKWAYA', email: 'silas.g@gov.rw', role: 'Sector Officer', lastLogin: 'Yesterday', status: 'inactive' },
        { id: 4, name: 'Alice INGABIRE', email: 'alice.i@gov.rw', role: 'Admin', lastLogin: '3 days ago', status: 'active' },
    ];

    const logs = [
        { id: 101, action: t('admin.logs.role_changed'), target: 'Silas GAKWAYA', detail: 'Agenti → Sector Officer', by: 'Admin Alice', time: 'Mar 12, 14:30' },
        { id: 102, action: t('admin.logs.system_sync'), target: 'NIDA', detail: 'Manual re-sync triggered', by: 'System', time: 'Mar 12, 09:00' },
        { id: 103, action: t('admin.logs.rule_updated'), target: t('detail.graduation_package'), detail: 'Minimum livestock count changed to 1', by: 'Admin Alice', time: 'Mar 11, 16:20' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                        <Shield className="text-primary" />
                        {t('admin.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('admin.subtitle')}</p>
                </div>
                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'users' ? "bg-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}
                    >{t('admin.tabs.users')}</button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'rules' ? "bg-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}
                    >{t('admin.tabs.rules')}</button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'system' ? "bg-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}
                    >{t('admin.tabs.system')}</button>
                </div>
            </div>

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={t('admin.search_users')} className="input-field pl-10 h-10 bg-white" />
                        </div>
                        <button className="btn-primary flex items-center gap-2">
                            <UserPlus size={18} />
                            {t('admin.add_user')}
                        </button>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">{t('admin.table.head_user')}</th>
                                    <th className="px-6 py-4">{t('admin.table.head_role')}</th>
                                    <th className="px-6 py-4">{t('admin.table.head_last_login')}</th>
                                    <th className="px-6 py-4">{t('common.status')}</th>
                                    <th className="px-6 py-4 text-right">{t('admin.table.head_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                                    <p className="text-[11px] text-slate-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded">{u.role}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{u.lastLogin}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", u.status === 'active' ? "bg-emerald-500" : "bg-slate-300")} />
                                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                                    {u.status === 'active' ? t('admin.status_active') : t('admin.status_inactive')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Edit size={16} /></button>
                                                <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="card">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <History size={18} className="text-primary" />
                            {t('admin.audit_trail_title')}
                        </h3>
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{log.action}: {log.target}</p>
                                            <p className="text-xs text-slate-500">{log.detail}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</p>
                                        <p className="text-[10px] text-primary/60 font-medium whitespace-nowrap">{t('admin.by_prefix')} {log.by}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">{t('admin.sequencing_rules')}</h3>
                            <button className="text-xs font-bold text-primary hover:underline">{t('admin.restore_defaults')}</button>
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: t('registration.steps.hgi_status'), val: 'Girinka OR VUP' },
                                { label: t('common.ubudehe_class'), val: 'Class 1 or 2' },
                                { label: t('livestock.health_event'), val: 'Health Certification' },
                                { label: t('detail.roadmap'), val: '18 Months Minimum' },
                            ].map(rule => (
                                <div key={rule.label} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rule.label}</p>
                                        <p className="text-sm font-bold text-slate-900 mt-1">{rule.val}</p>
                                    </div>
                                    <button className="p-2 text-primary bg-white rounded-lg shadow-sm hover:scale-105 transition-transform">
                                        <Edit size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-4">
                            <Settings2 className="text-amber-500 shrink-0 mt-0.5" size={20} />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Note:</strong> {t('admin.rule_impact_warning')}
                            </p>
                        </div>
                    </div>

                    <div className="card bg-slate-900 text-white border-none py-8">
                        <h3 className="text-lg font-bold mb-6">{t('admin.initial_package_title')}</h3>
                        <p className="text-sm text-slate-400 mb-8 leading-relaxed">{t('admin.initial_package_desc')}</p>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-accent">Package A (Class 1)</span>
                                    <span className="text-[10px] text-white/40">Default</span>
                                </div>
                                <p className="text-sm">Girinka + VUP Cash Transfer + Ejo Heza Subsidy</p>
                            </div>
                        </div>
                        <button className="btn-primary w-full mt-8 bg-accent text-primary">{t('admin.modify_packages')}</button>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="card text-center py-10">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                            <Activity size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">99.9% Uptime</h4>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{t('admin.system_health')}</p>
                        <div className="mt-6 flex items-center justify-center gap-1.5 overflow-hidden h-1">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="flex-1 h-full bg-emerald-500 rounded-full" />
                            ))}
                        </div>
                    </div>

                    <div className="card text-center py-10">
                        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                            <Database size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">4 Histo-Syncs</h4>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{t('admin.minaloc_sync')}</p>
                        <p className="text-xs text-slate-500 mt-4">{t('dashboard.last_updated')}: 25 mins ago</p>
                    </div>

                    <div className="card text-center py-10">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mx-auto mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Daily Backup</h4>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{t('admin.daily_backup')}</p>
                        <p className="text-xs text-slate-500 mt-4">Last automatic: 3:00 AM CAT</p>
                    </div>

                    <div className="md:col-span-3 card bg-slate-50 border-none">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{t('admin.api_gateway')}</h3>
                            <span className="text-xs font-bold text-slate-400">{t('dashboard.view_all') || 'Live'}</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'NIDA identity Lookup', lat: '1.2s', status: 'optimal' },
                                { name: 'MINALOC Social Registry', lat: '2.4s', status: 'stable' },
                                { name: 'Ejo Heza RSSB Bridge', lat: '0.8s', status: 'optimal' },
                                { name: 'SMS Gateway Nyabihu', lat: '4.1s', status: 'delayed' },
                            ].map(api => (
                                <div key={api.name} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {api.status === 'optimal' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-amber-500" />}
                                        <span className="text-sm font-bold text-slate-700">{api.name}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-xs font-mono font-bold text-slate-400">{api.lat}</span>
                                        <span className={cn("text-[10px] font-bold uppercase tracking-widest",
                                            api.status === 'optimal' ? "text-emerald-500" : "text-amber-500")}>
                                            {api.status === 'optimal' ? t('admin.status_optimal') : api.status === 'stable' ? t('admin.status_stable') : t('admin.status_delayed')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
