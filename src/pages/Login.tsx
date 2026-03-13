import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import LanguageToggle from '../components/LanguageToggle';
import { Lock, User, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState<Role>('district_officer');
    const [attempts, setAttempts] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login error for the first 5 attempts if field is empty (demo purposes)
        const form = e.currentTarget as HTMLFormElement;
        const username = (form.elements.namedItem('username') as HTMLInputElement).value;
        if (!username) {
            setAttempts(prev => prev + 1);
            return;
        }

        login(role);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Watermark/Decoration */}
            <div className="absolute top-0 right-0 p-8">
                <LanguageToggle />
            </div>

            <div className="flex flex-col items-center mb-10 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                    <ShieldCheck size={48} className="text-primary" />
                </div>
                <h1 className="text-4xl text-primary mb-2">{t('login.title')}</h1>
                <p className="text-slate-500 font-medium">{t('login.subtitle')}</p>
            </div>

            <div className="card w-full max-w-md shadow-xl border-t-4 border-t-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('login.username')}
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                name="username"
                                type="text"
                                className="input-field pl-10"
                                placeholder="e.g. j.habimana"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('login.password')}
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                name="password"
                                type="password"
                                className="input-field pl-10"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('login.role')}
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="input-field appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_10px_center] bg-no-repeat"
                        >
                            <option value="beneficiary">{t('roles.beneficiary')}</option>
                            <option value="agenti">{t('roles.agenti')}</option>
                            <option value="sector_officer">{t('roles.sector_officer')}</option>
                            <option value="district_officer">{t('roles.district_officer')}</option>
                            <option value="admin">{t('roles.admin')}</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <a href="#" className="text-sm font-medium text-primary hover:underline">
                            {t('login.forgot_password')}
                        </a>
                    </div>

                    {attempts >= 5 ? (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 animate-bounce">
                            <Lock size={20} />
                            <p className="text-sm font-semibold">{t('login.failed_attempts')}</p>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            className="btn-primary w-full py-3"
                        >
                            {t('login.sign_in')}
                        </button>
                    )}
                </form>
            </div>

            <div className="mt-8 flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/1200px-Coat_of_arms_of_Rwanda.svg.png" alt="Rwanda Coat of Arms" className="h-12" />
            </div>
        </div>
    );
};

export default Login;
