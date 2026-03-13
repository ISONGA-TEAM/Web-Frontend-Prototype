import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users,
    CheckCircle2,
    AlertTriangle,
    MessageSquare,
    ArrowUpRight,
    TrendingUp,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

const registrationData = [
    { month: 'Oct', registrations: 120 },
    { month: 'Nov', registrations: 180 },
    { month: 'Dec', registrations: 150 },
    { month: 'Jan', registrations: 210 },
    { month: 'Feb', registrations: 280 },
    { month: 'Mar', registrations: 347 },
];

const coverageData = [
    { name: 'Girinka', enrolled: 450, target: 500 },
    { name: 'VUP', enrolled: 320, target: 400 },
    { name: 'Ejo Heza', enrolled: 480, target: 500 },
];

const Dashboard: React.FC = () => {
    const { t } = useTranslation();

    const kpis = [
        { title: t('dashboard.kpi_total_households'), value: '347 / 500', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: t('dashboard.kpi_graduated_ytd'), value: '82', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: t('dashboard.kpi_active_alerts'), value: '5', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: t('dashboard.kpi_pending_messages'), value: '12', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const recentActivity = [
        { action: t('registration.steps.hgi_status'), target: 'MUKAMANA Solange', time: '10 mins ago', user: 'Agent Marie' },
        { action: t('livestock.health_event'), target: 'Cow #RW-2034 (Illness)', time: '25 mins ago', user: 'Vet Silas' },
        { action: t('reports.graduation_rate'), target: 'HABIMANA Jean', time: '1 hour ago', user: 'District Officer' },
        { action: t('messages.title'), target: 'NYABUHU Sector A', time: '2 hours ago', user: 'System' },
        { action: t('admin.system_health'), target: 'NIDA Database', time: '4 hours ago', user: 'System' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">{t('dashboard.title')}</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Clock size={16} />
                        {t('dashboard.last_updated')}: {new Date().toLocaleTimeString()}
                    </p>
                </div>
                <button className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
                    <TrendingUp size={18} />
                    {t('dashboard.view_all')}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="card group hover:scale-[1.02] transition-transform cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className={cn("p-3 rounded-2xl", kpi.bg)}>
                                <kpi.icon size={24} className={kpi.color} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <ArrowUpRight size={12} />
                                +12%
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-semibold text-slate-500">{kpi.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registration Chart */}
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">{t('dashboard.registration_trend')}</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={registrationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#1B4332', strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="registrations"
                                    stroke="#1B4332"
                                    strokeWidth={3}
                                    dot={{ fill: '#F59E0B', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Coverage Chart */}
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">{t('dashboard.hgi_coverage')}</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={coverageData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={70} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="enrolled" fill="#1B4332" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="target" fill="#F59E0B" fillOpacity={0.2} radius={[0, 4, 4, 0]} barSize={10} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 mt-4">
                        {coverageData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-600">{item.name}</span>
                                <span className="font-bold text-primary">{Math.round((item.enrolled / item.target) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">{t('dashboard.households_by_sector')}</h3>
                        <button className="text-primary text-sm font-bold hover:underline">{t('dashboard.view_all')}</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                    <th className="pb-4">{t('registry.table.head_location')}</th>
                                    <th className="pb-4 text-center">{t('registry.table.head_households') || 'Households'}</th>
                                    <th className="pb-4 text-center">{t('reports.graduation_rate')}</th>
                                    <th className="pb-4 text-right">{t('dashboard.registration_trend')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {['Muringa', 'Kabatwa', 'Jenda', 'Bigogwe'].map((sector, i) => (
                                    <tr key={sector} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 text-slate-900">{sector}</td>
                                        <td className="py-4 text-center text-slate-600">{85 - i * 10}</td>
                                        <td className="py-4 text-center text-emerald-600 font-bold">{22 - i * 4}</td>
                                        <td className="py-4 text-right">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full ml-auto overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${60 - i * 8}%` }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card bg-slate-50 border-none">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">{t('dashboard.recent_activity')}</h3>
                    <div className="space-y-6">
                        {recentActivity.map((activity, idx) => (
                            <div key={idx} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 group-first:ring-primary/20"></div>
                                    <div className="w-0.5 flex-1 bg-slate-200 mt-2 mb-[-12px]"></div>
                                </div>
                                <div className="pb-2">
                                    <p className="text-sm font-bold text-slate-900">{activity.action}</p>
                                    <p className="text-xs text-slate-600 mt-0.5">{activity.target}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activity.time}</span>
                                        <span className="text-[10px] text-primary/60 font-medium whitespace-nowrap">by {activity.user}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper for classNames (added inside the file as standard practice if no global util is used)
function cn(...inputs: (string | boolean | null | undefined)[]) {
    return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
