import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { ArrowRight, ArrowUpRight, Eye, EyeOff, Leaf, Lock, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { demoAccounts, demoPassword } from '../data/demo';
import { demoHouseholds } from '../data/households';

const Login: React.FC = () => {
    const { t, i18n } = useTranslation();
    const rw = i18n.language === 'rw';
    const copy = (en: string, kin: string) => rw ? kin : en;
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(false);
    const [help, setHelp] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!signIn(username, password)) { setError(true); return; }
        navigate('/dashboard', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#f7f8f2] p-4 sm:p-7 lg:p-10">
            <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 pb-7">
                <Link to="/" className="flex items-center gap-2.5 text-primary" aria-label="Isonga home">
                    <span className="rounded-xl bg-primary p-2 text-white"><ShieldCheck size={25} /></span>
                    <span className="text-2xl font-display font-bold tracking-tight">isonga<span className="text-amber-500">.</span></span>
                </Link>
                <div className="flex items-center gap-5"><Link to="/" className="hidden text-sm text-slate-600 hover:text-primary sm:block">{copy('Back to home', 'Subira ahabanza')}</Link><LanguageToggle /></div>
            </header>

            <main className="mx-auto grid max-w-7xl overflow-hidden rounded-[28px] border border-primary/10 bg-white shadow-xl shadow-primary/5 lg:grid-cols-[1.1fr_1fr]">
                <section className="relative flex flex-col justify-between overflow-hidden bg-[#173e31] p-7 text-white sm:p-12 lg:p-14">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-28 h-96 w-96 rounded-full border-[55px] border-white/[0.035]" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{copy('Together, towards self-reliance', 'Hamwe, tugana ku kwigira')}</span>
                        <h1 className="mt-8 max-w-lg text-4xl leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">{copy('Stronger households.', 'Imiryango ikomeye.')}<br /><span className="text-[#d7e9a6]">{copy('Brighter futures.', 'Ejo hazaza heza.')}</span></h1>
                        <p className="mt-6 max-w-sm text-base leading-7 text-emerald-50/75">{copy('One place to connect households with support, follow their progress, and make every step forward count.', 'Huriza hamwe ubufasha bw’imiryango, ukurikirane iterambere ryayo kandi ushyigikire buri ntambwe.')}</p>
                    </div>
                    <div className="relative mt-10 rounded-2xl border border-white/15 bg-white/[0.06] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-widest text-emerald-100/70">{copy('A path to opportunity', 'Inzira igana ku mahirwe')}</span><TrendingUp size={20} className="text-[#d7e9a6]" /></div>
                        <div className="mt-6 flex items-center gap-3"><span className="rounded-xl bg-[#d7e9a6] p-3 text-primary"><Users size={24} /></span><div><p className="font-semibold">{copy('People at the heart of progress', 'Abaturage ku isonga ry’iterambere')}</p><p className="mt-1 text-sm text-emerald-100/65">Girinka · VUP · Ejo Heza</p></div></div>
                        <div className="my-6 h-px bg-white/10" />
                        <div className="grid grid-cols-3 gap-3">
                            {[ [String(demoHouseholds.length), copy('Demo households', 'Imiryango y’icyitegererezo')], [String(new Set(demoHouseholds.map(h => h.location.sector)).size), copy('Sectors', 'Imirenge')], ['3', copy('Programs', 'Gahunda')] ].map(([value, label]) => <div key={label}><p className="text-2xl font-display font-bold text-[#d7e9a6]">{value}</p><p className="mt-1 text-xs text-emerald-100/70">{label}</p></div>)}
                        </div>
                    </div>
                    <p className="relative mt-8 flex items-center gap-2 text-xs text-emerald-100/60"><Leaf size={15} />{copy('Supporting Rwanda’s journey to self-reliance', 'Dushyigikiye urugendo rw’u Rwanda rwo kwigira')}</p>
                </section>

                <section className="flex flex-col justify-center p-7 sm:p-12 lg:p-14">
                    <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{copy('Your Isonga workspace', 'Urubuga rwawe rwa Isonga')}</p><h2 className="mt-3 text-3xl tracking-tight text-slate-900">{copy('Welcome back', 'Murakaza neza')}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{copy('Sign in to continue supporting your community.', 'Injira ukomeze gufasha abaturage.')}</p></div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div><label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">{t('login.username')}</label><input id="username" name="username" autoComplete="username" required value={username} onChange={e => { setUsername(e.target.value); setError(false); }} className="input-field h-12 bg-slate-50/50" placeholder="district.demo" aria-invalid={error} aria-describedby={error ? 'login-error' : undefined} /></div>
                        <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">{t('login.password')}</label><div className="relative"><input id="password" name="password" autoComplete="current-password" required value={password} onChange={e => { setPassword(e.target.value); setError(false); }} type={showPassword ? 'text' : 'password'} className="input-field h-12 bg-slate-50/50 pr-12" placeholder={copy('Enter your password', 'Andika ijambo ry’ibanga')} aria-invalid={error} aria-describedby={error ? 'login-error' : undefined} /><button type="button" aria-label={copy(showPassword ? 'Hide password' : 'Show password', showPassword ? 'Hisha ijambo ry’ibanga' : 'Erekana ijambo ry’ibanga')} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1 rounded-lg p-3 text-slate-500 hover:text-primary">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                        <div className="text-right"><button type="button" onClick={() => setHelp(!help)} aria-expanded={help} className="text-sm font-semibold text-primary hover:underline">{t('login.forgot_password')}</button></div>
                        {help && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{copy('For this demo, use any account below with password', 'Kuri iki cyitegererezo, koresha konti iri hasi n’ijambo ry’ibanga')} <strong>{demoPassword}</strong>.</p>}
                        {error && <p id="login-error" role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{copy('Username or password is incorrect. Try a demo account below.', 'Izina cyangwa ijambo ry’ibanga si byo. Gerageza konti iri hasi.')}</p>}
                        <button type="submit" className="btn-primary flex h-12 w-full items-center justify-center gap-3">{t('login.sign_in')}<ArrowRight size={18} /></button>
                    </form>
                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{copy('Explore with a demo account', 'Gerageza konti y’icyitegererezo')}</h3><span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">Demo</span></div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{copy('Choose an account to fill in your credentials. All records are fictional.', 'Hitamo konti wuzuze amakuru yo kwinjira. Amakuru yose ni ay’icyitegererezo.')}</p>
                        <div className="mt-4 flex flex-wrap gap-2">{demoAccounts.map(account => <button key={account.id} type="button" onClick={() => { setUsername(account.username); setPassword(demoPassword); setError(false); }} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary">{t(`roles.${account.role}`)}<ArrowUpRight size={13} /></button>)}</div>
                    </div>
                    <p className="mt-7 flex items-center gap-2 text-xs text-slate-400"><Lock size={13} />{copy('Prototype workspace · Demo access only', 'Urubuga rw’icyitegererezo')}</p>
                </section>
            </main>
            <footer className="mx-auto mt-6 max-w-7xl text-center text-xs text-slate-400">Isonga · {copy('Household Graduation Platform', 'Urubuga rw’iterambere ry’imiryango')}</footer>
        </div>
    );
};

export default Login;
