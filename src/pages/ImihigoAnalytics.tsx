import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart3,
    Calendar,
    ArrowUpRight,
    ChevronDown,
    FileSpreadsheet,
    FileText,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
const graduationTrendData = [
    { month: 'Oct', value: 45 },
    { month: 'Nov', value: 52 },
    { month: 'Dec', value: 48 },
    { month: 'Jan', value: 61 },
    { month: 'Feb', value: 75 },
    { month: 'Mar', value: 82 },
];

const sectorData = [
    { name: 'Muringa', households: 145, coverage: 92 },
    { name: 'Kabatwa', households: 132, coverage: 88 },
    { name: 'Jenda', households: 128, coverage: 85 },
    { name: 'Bigogwe', households: 110, coverage: 78 },
    { name: 'Rurembo', households: 95, coverage: 72 },
];

const ImihigoAnalytics: React.FC = () => {
    const { t } = useTranslation();
    const [range] = useState('This Month');
    const [generating, setGenerating] = useState(false);

    const handleGenerateReport = (type: 'pdf' | 'csv') => {
        setGenerating(true);
        setTimeout(() => {
            setGenerating(false);
            alert(`Report generated as ${type.toUpperCase()}`);
        }, 2000);
    };

    const kpis = [
        { title: t('dashboard.kpi_total_households'), value: '347', change: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: t('dashboard.kpi_graduated_ytd'), value: '82', change: '+8%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: t('dashboard.hgi_coverage'), value: '85%', change: '+3%', color: 'text-primary', bg: 'bg-primary/5' },
        { title: t('dashboard.kpi_active_alerts'), value: '94%', change: '+15%', color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: t('dashboard.kpi_pending_messages'), value: '98%', change: '+1%', color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                        <BarChart3 className="text-primary" />
                        {t('reports.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('reports.strategic_subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors">
                            <Calendar size={16} />
                            {range}
                            <ChevronDown size={14} />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleGenerateReport('pdf')}
                            disabled={generating}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all disabled:opacity-50"
                        >
                            {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                            {t('reports.export_pdf')}
                        </button>
                        <button
                            onClick={() => handleGenerateReport('csv')}
                            disabled={generating}
                            className="px-4 py-2 bg-white border border-primary text-primary rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/5 transition-all disabled:opacity-50"
                        >
                            <FileSpreadsheet size={16} />
                            {t('reports.export_csv')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {kpis.map((kpi, i) => (
                    <div key={i} className="card p-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{kpi.title}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                                <ArrowUpRight size={10} />
                                {kpi.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">{t('reports.graduation_trend')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graduationTrendData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1B4332" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#1B4332" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">{t('reports.sector_performance')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 600, fontSize: 12 }} width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="coverage" radius={[0, 4, 4, 0]} barSize={24}>
                                    {sectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.coverage > 80 ? '#1B4332' : entry.coverage > 70 ? '#F59E0B' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-xs font-medium text-slate-500">{t('reports.target_reached')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-accent" />
                            <span className="text-xs font-medium text-slate-500">{t('reports.at_risk')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-xs font-medium text-slate-500">{t('reports.critically_low')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card bg-slate-900 text-white border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BarChart3 size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 py-4">
                    <div>
                        <h3 className="text-2xl font-display font-bold">{t('reports.annual_evaluation')}</h3>
                        <p className="text-slate-400 mt-2 max-w-xl">
                            {t('reports.annual_evaluation_desc')}
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-accent text-primary font-bold rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-accent/20">
                        {t('reports.generate_full_report')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImihigoAnalytics;
