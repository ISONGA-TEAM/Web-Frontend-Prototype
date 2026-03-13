import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
    Users,
    Search,
    Filter,
    Plus,
    Map as MapIcon,
    Table as TableIcon,
    MoreVertical,
    CheckCircle2,
    Beef as Cow,
    Leaf
} from 'lucide-react';
import type { Household } from '../types';

// Mock data generator
const generateMockHouseholds = (count: number): Household[] => {
    const names = ['HABIMANA Jean', 'MUKAMANA Solange', 'NTAKIRUTIMANA Eric', 'UWIMANA Marie', 'GAKWAYA Silas', 'INGABIRE Alice', 'MUGABO David', 'NYIRAHABIMANA Beatrice', 'MUTANGUHA Paul', 'KAMANZI Alex'];
    const sectors = ['Nyabihu', 'Muringa', 'Kabatwa', 'Jenda', 'Bigogwe'];
    const status: Household['graduationStatus'][] = ['registered', 'assigned', 'enrolled', 'active', 'graduated'];

    return Array.from({ length: count }, (_, i) => ({
        id: `HH-${1000 + i}`,
        headName: names[i % names.length],
        nid: `11985800${1234567 + i}`,
        ubudehe: (i % 4 + 1) as Household['ubudehe'],
        location: {
            district: 'Nyabihu',
            sector: sectors[i % sectors.length],
            cell: 'Gasiza',
            village: 'Kovu'
        },
        programs: {
            girinka: { status: i % 3 === 0 ? 'enrolled' : 'not_eligible', date: i % 3 === 0 ? '2023-05-12' : undefined },
            vup: { status: i % 2 === 0 ? 'enrolled' : 'pending', date: i % 2 === 0 ? '2023-08-20' : undefined },
            ejo_heza: { status: i % 4 === 0 ? 'active' : 'pending', date: i % 4 === 0 ? '2024-01-15' : undefined },
        },
        graduationStatus: status[i % 5],
        lastUpdated: new Date().toISOString()
    }));
};

const HouseholdRegistry: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [households, setHouseholds] = useState<Household[]>([]);
    const [view, setView] = useState<'table' | 'map'>('table');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setHouseholds(generateMockHouseholds(20));
            setLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const getStatusBadge = (status: Household['graduationStatus']) => {
        const styles = {
            registered: 'bg-blue-50 text-blue-600 border-blue-100',
            assigned: 'bg-purple-50 text-purple-600 border-purple-100',
            enrolled: 'bg-amber-50 text-amber-600 border-amber-100',
            active: 'bg-primary/10 text-primary border-primary/20',
            graduated: 'bg-emerald-50 text-emerald-600 border-emerald-100'
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
                {t(`common.status_${status}`) || status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                        <Users className="text-primary" />
                        {t('registry.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('registry.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setView('table')}
                            className={`p-2 rounded-md transition-all ${view === 'table' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <TableIcon size={18} />
                        </button>
                        <button
                            onClick={() => setView('map')}
                            className={`p-2 rounded-md transition-all ${view === 'map' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <MapIcon size={18} />
                        </button>
                    </div>
                    <Link to="/households/register" className="btn-primary flex items-center gap-2">
                        <Plus size={18} />
                        {t('registry.register_new')}
                    </Link>
                </div>
            </div>

            <div className="card flex flex-col md:flex-row md:items-center gap-4 py-4 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('registry.search_placeholder')}
                        className="input-field pl-10 h-10 bg-slate-50 border-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select className="input-field h-10 w-40 text-sm bg-slate-50 border-none">
                        <option value="">{t('common.all_sectors')}</option>
                        <option value="muringa">Muringa</option>
                        <option value="kabatwa">Kabatwa</option>
                    </select>
                    <select className="input-field h-10 w-40 text-sm bg-slate-50 border-none">
                        <option value="">{t('common.ubudehe_class')}</option>
                        <option value="1">Class 1</option>
                        <option value="2">Class 2</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-all">
                        <Filter size={18} />
                        {t('common.filter')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="card divide-y divide-slate-100 p-0 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="p-6 flex items-center gap-6">
                            <div className="w-12 h-12 rounded-full skeleton" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 rounded skeleton" />
                                <div className="h-3 w-32 rounded skeleton" />
                            </div>
                            <div className="w-24 h-6 rounded-full skeleton" />
                            <div className="w-32 h-4 rounded skeleton" />
                            <div className="w-8 h-8 rounded-full skeleton" />
                        </div>
                    ))}
                </div>
            ) : view === 'map' ? (
                <div className="card h-[600px] flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200">
                    <div className="text-center">
                        <MapIcon size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Interactive Sector Map Placeholder</p>
                        <p className="text-sm text-slate-400">Loading pins for {households.length} households...</p>
                    </div>
                </div>
            ) : (
                <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                    <th className="px-6 py-4">{t('registry.table.head_name')}</th>
                                    <th className="px-6 py-4">{t('registry.table.head_location')}</th>
                                    <th className="px-6 py-4 text-center">{t('registry.table.head_ubudehe')}</th>
                                    <th className="px-6 py-4">{t('registry.table.head_programs')}</th>
                                    <th className="px-6 py-4">{t('common.status')}</th>
                                    <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {households.filter(h => h.headName.toLowerCase().includes(searchTerm.toLowerCase()) || h.nid.includes(searchTerm)).map((h) => (
                                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => window.location.href = `/households/${h.id}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {h.headName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{h.headName}</p>
                                                    <p className="text-xs text-slate-400 font-medium">NID: {h.nid}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-700">{h.location.sector}</p>
                                            <p className="text-xs text-slate-400">{h.location.cell}, {h.location.village}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs ring-1 ring-slate-200">
                                                {h.ubudehe}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {h.programs.girinka.status === 'enrolled' && (
                                                    <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Girinka Enrolled">
                                                        <Cow size={14} />
                                                    </div>
                                                )}
                                                {h.programs.vup.status === 'enrolled' && (
                                                    <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white" title="VUP Enrolled">
                                                        <Leaf size={14} />
                                                    </div>
                                                )}
                                                {h.programs.ejo_heza.status === 'active' && (
                                                    <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white" title="Ejo Heza Active">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(h.graduationStatus)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                <MoreVertical size={18} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HouseholdRegistry;
