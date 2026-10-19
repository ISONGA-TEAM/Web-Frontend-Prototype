import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Eye, EyeOff, Leaf, MapPinned, Network } from 'lucide-react';
import { demoOtp, demoUsers, useAuth } from '../context/AuthContext';
import { demoPassword } from '../data/seed';
import LanguageToggle from '../components/LanguageToggle';
import Logo from '../components/Logo';

const quick = ['admin.demo', 'national.demo', 'auditor.demo', 'province.demo', 'district.demo', 'district2.demo', 'sector.demo', 'cell.demo', 'agent.demo', 'household.demo'];

const Login: React.FC = () => {
    const { t, i18n } = useTranslation();
    const rw = i18n.language === 'rw';
    const copy = (en: string, kin: string) => rw ? kin : en;
    const { signIn, verifyOtp, pending, cancelOtp } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<'' | 'bad' | 'locked' | 'otp'>('');
    const [help, setHelp] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const r = signIn(username, password);
        if (r === 'ok') navigate('/dashboard', { replace: true });
        else if (r === 'otp') setError('');
        else setError(r);
    };
    const handleOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (verifyOtp(code)) navigate('/dashboard', { replace: true }); else setError('otp');
    };
    const message = error === 'locked' ? copy('Too many failed attempts. This account is locked for 30 minutes.', 'Wagerageje kenshi. Konti ifunzwe iminota 30.') : error === 'otp' ? copy('That code is not correct.', 'Iyo kode si yo.') : copy('Incorrect username or password.', 'Izina ry’ukoresha cyangwa ijambo ry’ibanga si byo.');

    return (
        <div className="flex min-h-dvh flex-col bg-[#f7f8f2] px-4 py-3 sm:px-7 sm:py-4 lg:h-dvh lg:overflow-hidden lg:px-10">
            <header className="mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between gap-4 pb-3">
                <Link to="/" aria-label="Isonga home"><Logo size={36} /></Link>
                <div className="flex items-center gap-5"><Link to="/" className="hidden text-sm text-slate-600 hover:text-primary sm:block">{copy('Back to home', 'Subira ahabanza')}</Link><LanguageToggle /></div>
            </header>

            <main className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 overflow-hidden rounded-[28px] border border-primary/10 bg-white shadow-xl shadow-primary/5 lg:grid-cols-[1.1fr_1fr]">
                <section className="relative hidden min-h-0 flex-col justify-between overflow-hidden bg-[#173e31] p-8 text-white lg:flex xl:p-12">
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Girinka Munyarwanda</span>
                        <h1 className="mt-5 max-w-lg text-4xl leading-[1.12] tracking-tight xl:text-5xl [@media(max-height:760px)]:text-4xl">{copy('Every cow, every calf.', 'Buri nka, buri nyana.')}<br /><span className="text-[#d7e9a6]">{copy('One traceable record.', 'Inyandiko imwe ikurikiranwa.')}</span></h1>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/75 xl:text-base xl:leading-7 [@media(max-height:680px)]:hidden">{copy('From MINALOC down to the village: who holds each animal, where it came from, and which calves are due to be passed on.', 'Kuva kuri MINALOC kugeza ku mudugudu: ufite buri nka, aho yaturutse, n’inyana zigomba gutangwa.')}</p>
                    </div>
                    <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/[0.06] p-5">
                        <div className="flex items-center gap-3"><span className="rounded-xl bg-[#d7e9a6] p-3 text-primary"><Network size={24} /></span><div><p className="font-semibold">{copy('Scoped to your jurisdiction', 'Rigendereye aho ukorera')}</p><p className="mt-1 text-sm text-emerald-100/65">{copy('National · Province · District · Sector · Cell · Village', 'Igihugu · Intara · Akarere · Umurenge · Akagari · Umudugudu')}</p></div></div>
                        <div className="my-4 h-px bg-white/10" />
                        <div className="flex items-center gap-3 text-sm text-emerald-100/75"><MapPinned size={18} className="text-[#d7e9a6]" />{copy('Prototype with fictional Nyabihu pilot data', 'Icyitegererezo gifite amakuru y’ibihimbano ya Nyabihu')}</div>
                    </div>
                    <p className="relative mt-5 flex items-center gap-2 text-xs text-emerald-100/60 [@media(max-height:760px)]:hidden"><Leaf size={15} />{copy('Supporting Rwanda’s Girinka programme', 'Dushyigikiye Girinka Munyarwanda')}</p>
                </section>

                <section className="flex min-h-0 flex-col justify-center overflow-y-auto p-6 sm:p-10 xl:p-14">
                    <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{copy('Isonga Girinka', 'Isonga Girinka')}</p><h2 className="mt-3 text-3xl tracking-tight text-slate-900">{copy('Welcome back', 'Murakaza neza')}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{pending ? copy('Enter the one-time code to finish signing in.', 'Andika kode y’inshuro imwe urangize kwinjira.') : copy('Sign in to continue.', 'Injira ukomeze.')}</p></div>
                    {!pending ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">{t('login.username')}</label><input id="username" name="username" autoComplete="username" required value={username} onChange={e => { setUsername(e.target.value); setError(''); }} className="input-field h-12 bg-slate-50/50" aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined} /></div>
                            <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">{t('login.password')}</label><div className="relative"><input id="password" name="password" autoComplete="current-password" required value={password} onChange={e => { setPassword(e.target.value); setError(''); }} type={showPassword ? 'text' : 'password'} className="input-field h-12 bg-slate-50/50 pr-12" aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1 rounded-lg p-3 text-slate-500 hover:text-primary">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                            <div className="text-right"><button type="button" onClick={() => setHelp(!help)} aria-expanded={help} className="text-sm font-semibold text-primary hover:underline">{t('login.forgot_password')}</button></div>
                            {help && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{copy('Use any account below with the password', 'Koresha konti iri hasi n’ijambo ry’ibanga')} <strong>{demoPassword}</strong>. {copy('Roles above Village also ask for a one-time code: use', 'Inshingano zisumba Umudugudu zisaba kode: koresha')} <strong>{demoOtp}</strong>.</p>}
                            {error && <p id="login-error" role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
                            <button type="submit" className="btn-primary flex h-12 w-full items-center justify-center gap-3">{t('login.sign_in')}<ArrowRight size={18} /></button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtp} className="space-y-4">
                            <p className="text-sm text-slate-600">{pending.name} · {t(`roles.${pending.role}`)}</p>
                            <div><label htmlFor="otp" className="mb-2 block text-sm font-semibold text-slate-700">{t('login.otp')}</label><input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={e => { setCode(e.target.value); setError(''); }} className="input-field h-12 bg-slate-50/50 tracking-[0.4em]" aria-invalid={error === 'otp'} /></div>
                            <p className="text-xs text-slate-500">{copy('Demo only: the real system sends this code by SMS or authenticator app. Use', 'Icyitegererezo gusa: sisitemu nyayo yohereza kode kuri SMS. Koresha')} <strong>{demoOtp}</strong>.</p>
                            {error === 'otp' && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
                            <button type="submit" className="btn-primary flex h-12 w-full items-center justify-center gap-3">{t('login.verify')}<ArrowRight size={18} /></button>
                            <button type="button" onClick={() => { cancelOtp(); setCode(''); }} className="w-full text-sm font-semibold text-slate-500 hover:text-primary">{copy('Use a different account', 'Koresha indi konti')}</button>
                        </form>
                    )}
                    {!pending && <div className="mt-5 border-t border-slate-100 pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{copy('Demo accounts', 'Konti z’icyitegererezo')}</p>
                        <div className="flex flex-wrap gap-2">{quick.map(u => demoUsers.find(x => x.username === u)!).map(account => <button key={account.id} type="button" onClick={() => { setUsername(account.username); setPassword(demoPassword); setError(''); }} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary">{t(`roles.${account.role}`)}<ArrowUpRight size={13} /></button>)}</div>
                    </div>}
                </section>
            </main>
            <footer className="mx-auto w-full max-w-7xl shrink-0 pt-3 text-center text-xs text-slate-400">Isonga · {copy('Girinka Digital Management System', 'Sisitemu y’ikoranabuhanga ya Girinka')}</footer>
        </div>
    );
};

export default Login;
