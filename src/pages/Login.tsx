import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { ArrowRight, ArrowUpRight, Eye, EyeOff, Leaf, Users, TrendingUp } from 'lucide-react';
import Logo from '../components/Logo';
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
        <div className="flex h-dvh flex-col overflow-hidden bg-[#f7f8f2] px-4 py-3 sm:px-7 sm:py-4 lg:px-10">
            <header className="mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between gap-4 pb-3">
                <Link to="/" aria-label="Isonga home"><Logo size={36} /></Link>
                <div className="flex items-center gap-5"><Link to="/" className="hidden text-sm text-slate-600 hover:text-primary sm:block">{copy('Back to home', 'Subira ahabanza')}</Link><LanguageToggle /></div>
            </header>

            <main className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 overflow-hidden rounded-[28px] border border-primary/10 bg-white shadow-xl shadow-primary/5 lg:grid-cols-[1.1fr_1fr]">
                <section className="relative hidden min-h-0 flex-col justify-between overflow-hidden bg-[#173e31] p-8 text-white lg:flex xl:p-12">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-28 h-96 w-96 rounded-full border-white/[0.035]" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{copy('Together, towards self-reliance', 'Hamwe, tugana ku kwigira')}</span>
                        <h1 className="mt-5 max-w-lg text-4xl leading-[1.12] tracking-tight xl:text-5xl [@media(max-height:760px)]:text-4xl">{copy('Stronger households.', 'Imiryango ikomeye.')}<br /><span className="text-[#d7e9a6]">{copy('Brighter futures.', 'Ejo hazaza heza.')}</span></h1>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/75 xl:text-base xl:leading-7 [@media(max-height:680px)]:hidden">{copy('One place to connect households with support, follow their progress, and make every step forward count.', 'Huriza hamwe ubufasha bw’imiryango, ukurikirane iterambere ryayo kandi ushyigikire buri ntambwe.')}</p>
                    </div>
                    <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/[0.06] p-5">
                        <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-widest text-emerald-100/70">{copy('A path to opportunity', 'Inzira igana ku mahirwe')}</span><TrendingUp size={20} className="text-[#d7e9a6]" /></div>
                        <div className="mt-4 flex items-center gap-3"><span className="rounded-xl bg-[#d7e9a6] p-3 text-primary"><Users size={24} /></span><div><p className="font-semibold">{copy('People at the heart of progress', 'Abaturage ku isonga ry’iterambere')}</p><p className="mt-1 text-sm text-emerald-100/65">Girinka · VUP · Ejo Heza</p></div></div>
                        <div className="my-4 h-px bg-white/10" />
                        <div className="grid grid-cols-3 gap-3">
                            {[ [String(demoHouseholds.length), copy('Demo households', 'Imiryango y’icyitegererezo')], [String(new Set(demoHouseholds.map(h => h.location.sector)).size), copy('Sectors', 'Imirenge')], ['3', copy('Programs', 'Gahunda')] ].map(([value, label]) => <div key={label}><p className="text-2xl font-display font-bold text-[#d7e9a6]">{value}</p><p className="mt-1 text-xs text-emerald-100/70">{label}</p></div>)}
                        </div>
                    </div>
                    <p className="relative mt-5 flex items-center gap-2 text-xs text-emerald-100/60 [@media(max-height:760px)]:hidden"><Leaf size={15} />{copy('Supporting Rwanda’s journey to self-reliance', 'Dushyigikiye urugendo rw’u Rwanda rwo kwigira')}</p>
                </section>

                <section className="flex min-h-0 flex-col justify-center overflow-hidden p-6 sm:p-10 xl:p-14">
                    <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{copy('Your Isonga workspace', 'Urubuga rwawe rwa Isonga')}</p><h2 className="mt-3 text-3xl tracking-tight text-slate-900">{copy('Welcome back', 'Murakaza neza')}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{copy('Sign in to continue supporting your community.', 'Injira ukomeze gufasha abaturage.')}</p></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">{t('login.username')}</label><input id="username" name="username" autoComplete="username" required value={username} onChange={e => { setUsername(e.target.value); setError(false); }} className="input-field h-12 bg-slate-50/50" placeholder="district.demo" aria-invalid={error} aria-describedby={error ? 'login-error' : undefined} /></div>
                        <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">{t('login.password')}</label><div className="relative"><input id="password" name="password" autoComplete="current-password" required value={password} onChange={e => { setPassword(e.target.value); setError(false); }} type={showPassword ? 'text' : 'password'} className="input-field h-12 bg-slate-50/50 pr-12" placeholder={copy('Enter your password', 'Andika ijambo ry’ibanga')} aria-invalid={error} aria-describedby={error ? 'login-error' : undefined} /><button type="button" aria-label={copy(showPassword ? 'Hide password' : 'Show password', showPassword ? 'Hisha ijambo ry’ibanga' : 'Erekana ijambo ry’ibanga')} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1 rounded-lg p-3 text-slate-500 hover:text-primary">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                        <div className="text-right"><button type="button" onClick={() => setHelp(!help)} aria-expanded={help} className="text-sm font-semibold text-primary hover:underline">{t('login.forgot_password')}</button></div>
                        {help && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{copy('For this demo, use any account below with password', 'Kuri iki cyitegererezo, koresha konti iri hasi n’ijambo ry’ibanga')} <strong>{demoPassword}</strong>.</p>}
                        {error && <p id="login-error" role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{copy('Incorrect username or password.', 'Izina ry’ukoresha cyangwa ijambo ry’ibanga si byo.')}</p>}
                        <button type="submit" className="btn-primary flex h-12 w-full items-center justify-center gap-3">{t('login.sign_in')}<ArrowRight size={18} /></button>
                    </form>
                    <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap gap-2">{demoAccounts.map(account => <button key={account.id} type="button" onClick={() => { setUsername(account.username); setPassword(demoPassword); setError(false); }} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary">{t(`roles.${account.role}`)}<ArrowUpRight size={13} /></button>)}</div>
                    </div>
                </section>
            </main>
            <footer className="mx-auto w-full max-w-7xl shrink-0 pt-3 text-center text-xs text-slate-400">Isonga · {copy('Household Graduation Platform', 'Urubuga rw’iterambere ry’imiryango')}</footer>
        </div>
    );
};

export default Login;
