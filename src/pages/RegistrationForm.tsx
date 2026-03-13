import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Search,
    ShieldCheck,
    Users,
    MapPin,
    WifiOff,
    AlertCircle,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const RegistrationForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [nidFound, setNidFound] = useState(false);
    const [isOffline] = useState(!navigator.onLine);
    const [registered, setRegistered] = useState(false);

    const [formData, setFormData] = useState({
        nid: '',
        fullName: '',
        householdSize: '4',
        ubudehe: '2',
        district: 'Nyabihu',
        sector: '',
        cell: '',
        village: '',
        girinka: false,
        vup: false,
        ejoHeza: false,
    });

    const steps = [
        { title: t('registration.steps.id_verification'), icon: ShieldCheck },
        { title: t('registration.steps.basic_info'), icon: Users },
        { title: t('registration.steps.hgi_status'), icon: MapPin },
        { title: t('registration.steps.review'), icon: Check }
    ];

    const handleNIDLookup = () => {
        if (formData.nid.length !== 16) return;
        setLoading(true);
        setTimeout(() => {
            setNidFound(true);
            setFormData(prev => ({ ...prev, fullName: 'HABIMANA Jean de Dieu' }));
            setLoading(false);
        }, 1500);
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setRegistered(true);
            // Auto-login as the agenti role and redirect to dashboard
            login('agenti');
            setTimeout(() => navigate('/dashboard'), 1500);
        }, 2000);
    };

    if (registered) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} />
                </div>
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900">{isOffline ? t('registration.complete') : t('registration.success')}</h2>
                    <p className="text-slate-500 mt-2">{isOffline ? t('registration.offline_msg') : t('registration.redirecting')}</p>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Loader2 className="animate-spin" size={20} />
                    <span>{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {isOffline && (
                <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
                    <WifiOff size={20} />
                    <p className="text-sm font-bold">{t('registration.offline_msg')}</p>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">{t('registration.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('registration.subtitle')}</p>
                </div>
                <button onClick={() => navigate('/households')} className="text-slate-400 hover:text-slate-600 transition-colors">
                    {t('common.cancel')}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="card py-6 px-10">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 -z-0">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                        />
                    </div>
                    {steps.map((s, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-300",
                                step > i + 1 ? "bg-primary text-white" :
                                    step === i + 1 ? "bg-accent text-primary font-bold" : "bg-white text-slate-300 border-slate-100"
                            )}>
                                {step > i + 1 ? <Check size={18} /> : (i + 1)}
                            </div>
                            <span className={cn(
                                "mt-2 text-[10px] font-bold uppercase tracking-wider",
                                step === i + 1 ? "text-primary" : "text-slate-400"
                            )}>{s.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card min-h-[400px] flex flex-col">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="max-w-md space-y-4">
                            <h3 className="text-xl font-bold text-slate-900">{t('registration.nid_verification')}</h3>
                            <p className="text-slate-500 text-sm">{t('registration.nid_instruction')}</p>

                            <div className="flex gap-3 mt-6">
                                <input
                                    type="text"
                                    maxLength={16}
                                    placeholder="1 19XX X XXXX XXX X XX"
                                    className="input-field font-mono text-lg tracking-widest flex-1"
                                    value={formData.nid}
                                    onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                                />
                                <button
                                    onClick={handleNIDLookup}
                                    disabled={formData.nid.length !== 16 || loading}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                    {t('registration.verify_button')}
                                </button>
                            </div>

                            {nidFound && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-4 animate-in zoom-in-95 duration-300">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0">
                                        <Check size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">{t('registration.nid_found')}</p>
                                        <p className="text-lg font-bold text-slate-900 mt-1">{formData.fullName}</p>
                                        <p className="text-xs text-emerald-600 font-medium">{t('registration.verified_identity')}</p>
                                    </div>
                                </div>
                            )}

                            {formData.nid === '1111111111111111' && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-red-900">{t('registration.duplicate_nid_error')}</p>
                                        <p className="text-xs text-red-600 mt-1">{t('registration.duplicate_error')} <a href="#" className="underline">{t('common.view')}</a></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900">{t('registration.basic_info_title')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t('registration.full_name')}</label>
                                    <input type="text" className="input-field" value={formData.fullName} readOnly />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t('registration.household_size')}</label>
                                    <input
                                        type="number" min="1" max="20" className="input-field"
                                        value={formData.householdSize}
                                        onChange={(e) => setFormData({ ...formData, householdSize: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t('common.ubudehe_class')}</label>
                                    <select
                                        className="input-field"
                                        value={formData.ubudehe}
                                        onChange={(e) => setFormData({ ...formData, ubudehe: e.target.value })}
                                    >
                                        <option value="1">Class 1</option>
                                        <option value="2">Class 2</option>
                                        <option value="3">Class 3</option>
                                        <option value="4">Class 4</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900">{t('registration.admin_location')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t('registration.district')}</label>
                                    <input type="text" className="input-field bg-slate-50" value="Nyabihu" readOnly />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t('registration.sector')}</label>
                                    <select className="input-field">
                                        <option>Muringa</option>
                                        <option>Kabatwa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t('registration.cell')}</label>
                                    <select className="input-field">
                                        <option>Gasiza</option>
                                        <option>Kovu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t('registration.village')}</label>
                                    <select className="input-field">
                                        <option>Kovu I</option>
                                        <option>Kovu II</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-bold text-slate-900">{t('registration.steps.hgi_status')}</h3>
                        <p className="text-slate-500 text-sm">{t('registration.program_check_desc')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: 'girinka', name: 'Girinka', desc: t('registration.girinka_desc') },
                                { id: 'vup', name: 'VUP', desc: t('registration.vup_desc') },
                                { id: 'ejoHeza', name: 'Ejo Heza', desc: t('registration.ejo_heza_desc') }
                            ].map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => setFormData(prev => ({ ...prev, [p.id]: !prev[p.id as keyof typeof formData] }))}
                                    className={cn(
                                        "p-6 rounded-2xl border-2 transition-all cursor-pointer",
                                        formData[p.id as keyof typeof formData] ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors",
                                        formData[p.id as keyof typeof formData] ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <Check size={20} />
                                    </div>
                                    <h4 className="font-bold text-slate-900">{p.name}</h4>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-bold text-slate-900">{t('registration.steps.review')}</h3>
                        <div className="bg-slate-50 rounded-2xl p-6 grid grid-cols-2 gap-y-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('registration.nid_full_name')}</p>
                                <p className="font-bold text-slate-900 mt-1">{formData.nid}</p>
                                <p className="text-sm text-slate-600">{formData.fullName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('registration.admin_location')}</p>
                                <p className="font-bold text-slate-900 mt-1">Nyabihu, Muringa</p>
                                <p className="text-sm text-slate-600">Gasiza Cell, Kovu Village</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('registration.categorization')}</p>
                                <p className="font-bold text-slate-900 mt-1">{t('common.ubudehe_class')} {formData.ubudehe}</p>
                                <p className="text-sm text-slate-600">{t('registration.size_members', { count: parseInt(formData.householdSize) })}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('registration.programs')}</p>
                                <div className="flex gap-2 mt-1">
                                    {formData.girinka && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">GIRINKA</span>}
                                    {formData.vup && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">VUP</span>}
                                    {formData.ejoHeza && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">EJO HEZA</span>}
                                    {!formData.girinka && !formData.vup && !formData.ejoHeza && <span className="text-slate-400 text-xs italic">{t('registration.no_programs')}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/10 rounded-xl flex items-center gap-3 text-primary">
                            <CheckCircle2 size={20} />
                            <p className="text-sm font-bold text-primary/80">{t('registration.initial_package_note')}</p>
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-10 flex items-center justify-between border-t border-slate-50">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-6 py-2 text-slate-400 font-bold disabled:opacity-30 hover:text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        {t('common.back')}
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            disabled={step === 1 && !nidFound}
                            className="btn-primary flex items-center gap-2 pr-4"
                        >
                            {t('common.next')}
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn-primary px-10 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {t('registration.complete')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegistrationForm;
