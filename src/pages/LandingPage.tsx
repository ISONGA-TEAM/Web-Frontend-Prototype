import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck,
    Users,
    TrendingUp,
    Beef as Cow,
    MessageSquare,
    BarChart3,
    Globe,
    ChevronRight,
    MapPin,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    BookOpen,
    Star
} from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

const stats = [
    { value: '12,400+', label: 'Households Enrolled', labelRw: 'Imiryango Iyanditse' },
    { value: '84%', label: 'Graduation Rate', labelRw: 'Igipimo cya Graduation' },
    { value: '5', label: 'Sectors Covered', labelRw: 'Imirenge Ikurikiranwa' },
    { value: '3', label: 'Active Programs', labelRw: 'Gahunda Zikorwa' },
];

const features = [
    {
        icon: Users,
        color: 'bg-emerald-50 text-emerald-600',
        title: 'Household Registry',
        titleRw: 'Inyandiko z\'Imiryango',
        desc: 'Centralized registry of all vulnerable households with NID verification, Ubudehe classification, and real-time updates.',
        descRw: 'Inyandiko y\'imiryango yuburire yose hamwe no kugenzura NID, icyiciro cy\'ubudehe, n\'amakuru mashya.'
    },
    {
        icon: Cow,
        color: 'bg-amber-50 text-amber-600',
        title: 'Livestock Monitoring',
        titleRw: 'Gukurikirana Amatungo',
        desc: 'Real-time health tracking of Girinka assets with vet event logs, vaccination schedules, and mortality alerts.',
        descRw: 'Gukurikirana ubuzima bw\'amatungo mu gihe nyacyo hamwe n\'inkingo, n\'ubutumwa bwihutirwa.'
    },
    {
        icon: TrendingUp,
        color: 'bg-blue-50 text-blue-600',
        title: 'Imihigo Analytics',
        titleRw: 'Imibare y\'Imihigo',
        desc: 'Performance dashboards, graduation trend analysis, and exportable reports against MINALOC targets.',
        descRw: 'Gukurikirana imikorere, iterambere rya graduation, no gutanga raporo z\'imikorere.'
    },
    {
        icon: MessageSquare,
        color: 'bg-purple-50 text-purple-600',
        title: 'Citizen Messaging',
        titleRw: 'Ubutumwa bw\'Abaturage',
        desc: 'Two-way messaging with SMS fallback, broadcast announcements, and voice call scheduling.',
        descRw: 'Gutumanahana n\'abaturage binyuze mu butumwa, SMS, n\'guhamagara.'
    },
    {
        icon: BarChart3,
        color: 'bg-rose-50 text-rose-600',
        title: 'HGI Programs',
        titleRw: 'Gahunda za HGI',
        desc: 'Manage Girinka, VUP, and Ejo Heza enrollments with sequencing rules and automatic package assignments.',
        descRw: 'Cunga gahunda za Girinka, VUP, na Ejo Heza hamwe n\'amategeko y\'urwego.'
    },
    {
        icon: ShieldCheck,
        color: 'bg-teal-50 text-teal-600',
        title: 'System Administration',
        titleRw: 'Ubugenzuzi bwa Sisitemu',
        desc: 'Role-based access control, audit trails, NIDA integration, and MINALOC database synchronization.',
        descRw: 'Iyegurwa ry\'inshingano, gukurikirana ibikorwa, na guhuza na NIDA na MINALOC.'
    },
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { isAuthenticated } = useAuth();
    const isRw = i18n.language === 'rw';
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="font-display font-bold text-lg text-slate-900">Isonga</span>
                            <span className="hidden sm:inline text-xs text-slate-400 ml-2 font-medium">Integrated Graduation Platform</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageToggle />
                        <button
                            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                            className="px-5 py-2.5 border-2 border-primary text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all"
                        >
                            {isAuthenticated ? (isRw ? 'Dashboard' : 'Dashboard') : (isRw ? 'Injira' : 'Sign In')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-primary to-emerald-900 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
                    {/* Grid pattern */}
                    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
                        <MapPin size={14} className="text-accent" />
                        <span className="text-white/80 text-sm font-medium">Nyabihu District, Western Province, Rwanda</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6">
                        {isRw ? (
                            <>Gahunda Nziza<br />ya <span className="text-accent">Graduation</span></>
                        ) : (
                            <>The Smarter Way to<br />Manage <span className="text-accent">Graduation</span></>
                        )}
                    </h1>

                    <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                        {isRw
                            ? 'Sisitemu igezweho yo gukurikirana iterambere ry\'imiryango yuburire, kugenga gahunda za HGI, no gufasha abaturage gutunga ubutunzi bwabo.'
                            : 'A modern, integrated platform for tracking household graduation progress, managing HGI programs, and empowering field agents with real-time data.'}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                            className="group flex items-center gap-3 bg-accent text-primary font-bold px-8 py-4 rounded-2xl text-lg hover:scale-105 transition-all shadow-xl shadow-amber-500/25 active:scale-95"
                        >
                            <Sparkles size={20} />
                            {isAuthenticated ? (isRw ? 'Gana kuri Dashboard' : 'Go to Dashboard') : (isRw ? 'Tangira Ubu' : 'Get Started')}
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => {
                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 text-white/70 font-bold px-6 py-4 rounded-2xl hover:text-white hover:bg-white/10 transition-all"
                        >
                            <BookOpen size={18} />
                            {isRw ? 'Menya byinshi' : 'Learn More'}
                        </button>
                    </div>
                </div>

                {/* Bottom wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="white"/>
                    </svg>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((s, i) => (
                            <div key={i} className="text-center group">
                                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2 group-hover:scale-110 transition-transform">{s.value}</p>
                                <p className="text-slate-500 text-sm font-medium">{isRw ? s.labelRw : s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* District Banner */}
            <section className="py-6 bg-primary/5 border-y border-primary/10">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <Globe size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{isRw ? 'Akarere ka Nyabihu' : 'Nyabihu District'}</p>
                            <p className="text-xs text-slate-500">{isRw ? 'Intara y\'Iburengerazuba, Rwanda' : 'Western Province, Rwanda'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {['MINALOC', 'NIDA', 'RSSB', 'VUP'].map(partner => (
                            <span key={partner} className="text-xs font-bold text-slate-400 uppercase tracking-widest">{partner}</span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-bold">{isRw ? 'Sisitemu irakora' : 'System Operational'}</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
                            <Star size={14} />
                            <span className="text-sm font-bold">{isRw ? 'Ibikubiyemo' : 'Platform Features'}</span>
                        </div>
                        <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">
                            {isRw ? 'Ibikubiyemo muri Sisitemu' : 'Everything You Need to Graduate Households'}
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            {isRw
                                ? 'Ibikoresho byose bigufasha gukurikirana iterambere ry\'imiryango, kugenga gahunda, no gutanga raporo z\'imikorere.'
                                : 'All the tools you need to track progress, manage programs, and generate actionable reports in one platform.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="group p-8 bg-white border border-slate-100 rounded-3xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-default"
                            >
                                <div className={`inline-flex p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110 ${f.color}`}>
                                    <f.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{isRw ? f.titleRw : f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{isRw ? f.descRw : f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-gradient-to-br from-primary via-primary to-emerald-800 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/10 rounded-full" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                        {isRw ? 'Tangira Gukoresha Isonga Ubu' : 'Ready to Transform Graduation Monitoring?'}
                    </h2>
                    <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                        {isRw
                            ? 'Injira muri sisitemu urebe imikorere y\'imiryango mu gihe nyacyo no kugenzura iterambere.'
                            : 'Sign in to access your dashboard and start monitoring household graduation progress in real time.'}
                    </p>
                    <button
                        onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                        className="group inline-flex items-center gap-3 bg-accent text-primary font-bold px-10 py-5 rounded-2xl text-lg hover:scale-105 transition-all shadow-2xl shadow-black/20 active:scale-95"
                    >
                        {isAuthenticated ? (isRw ? 'Gana kuri Dashboard' : 'Go to Dashboard') : (isRw ? 'Injira muri Sisitemu' : 'Sign In to Platform')}
                        <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-white py-12">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-white">Isonga Platform</p>
                            <p className="text-xs text-slate-500">Nyabihu District · Rwanda</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 text-center">
                        © 2024 MINALOC — National Social Protection Strategy · Built for Rwanda's Graduation Program
                    </p>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {isRw ? 'Sisitemu irakora neza' : 'All systems operational'}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
