import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, ExternalLink, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { answer, scrub, suggestions } from '../lib/assistant';
import type { Answer, Lang } from '../lib/assistant';
import { approvalDenial, can } from '../lib/rules';
import * as E from '../lib/engine';

interface Turn { q: string; a: Answer }

/** Floating assistant, reachable from every page. The same mock as the Assistant page: no model, figures traced to named queries. */
export default function AssistantWidget() {
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { i18n } = useTranslation();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const [lang, setLang] = useState<Lang>(i18n.language === 'en' ? 'en' : 'rw');
    const [q, setQ] = useState('');
    const [turns, setTurns] = useState<Turn[]>([]);
    const input = useRef<HTMLInputElement>(null);
    const end = useRef<HTMLDivElement>(null);

    useEffect(() => { if (open) input.current?.focus(); }, [open]);
    useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }); }, [turns, open]);
    useEffect(() => {
        if (!open) return;
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [open]);

    if (!user || !can(user, 'page_assistant') || pathname.startsWith('/assistant')) return null;
    const mine = data.transfers.filter(t => approvalDenial(user, t) === null).length;
    const ask = (text: string) => {
        if (!text.trim()) return;
        const a = answer(store, user, data, text, lang, mine);
        act((s, u) => E.logAssistant(s, u, 'question', a.intent, `prompt: ${scrub(text, store)} | answer: ${a.text}`));
        setTurns(t => [...t, { q: text, a }]); setQ('');
    };
    const submit = (e: FormEvent) => { e.preventDefault(); ask(q); };
    const rw = lang === 'rw';

    return <div className={`ai-widget ${pathname.startsWith('/permissions') ? 'raised' : ''}`}>
        {open && <section className="ai-panel" role="dialog" aria-label={rw ? 'Umufasha' : 'Assistant'}>
            <header>
                <span className="ai-title"><Bot size={16} aria-hidden="true" /><b>{rw ? 'Umufasha' : 'Assistant'}</b><small>{rw ? 'icyitegererezo' : 'mock, no model'}</small></span>
                <span className="ai-tools">
                    <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="rw">RW</option><option value="en">EN</option></select>
                    <Link to="/assistant" onClick={() => setOpen(false)} aria-label={rw ? 'Fungura urupapuro rwuzuye' : 'Open the full assistant'} title={rw ? 'Fungura urupapuro rwuzuye' : 'Open the full assistant'}><ExternalLink size={14} /></Link>
                    <button onClick={() => setOpen(false)} aria-label={rw ? 'Funga' : 'Close'}><X size={16} /></button>
                </span>
            </header>
            <div className="ai-body" aria-live="polite">
                {!turns.length && <div className="ai-welcome">
                    <p>{rw ? 'Muraho! Nshobora kubasubiza ku makuru y’aho mukorera gusa.' : 'Hello! I answer using only data from your own jurisdiction.'}</p>
                    <div className="ai-chips">{suggestions[lang].map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>
                </div>}
                {turns.map((t, i) => <div key={i} className="ai-turn">
                    <p className="ai-q">{t.q}</p>
                    <div className="ai-a"><p>{t.a.text}</p>
                        {t.a.sources.length > 0 && <details><summary>{rw ? 'Aho imibare yaturutse' : 'Where the figures come from'}</summary><ul>{t.a.sources.map(s => <li key={s.id}><code>{s.id}</code> {s.label}: <b>{s.value}</b>{s.link && <> · <Link to={s.link} onClick={() => setOpen(false)}>{rw ? 'Reba' : 'Open'}</Link></>}</li>)}</ul></details>}
                    </div>
                </div>)}
                <div ref={end} />
            </div>
            <form onSubmit={submit}>
                <input ref={input} aria-label={rw ? 'Ikibazo' : 'Question'} value={q} onChange={e => setQ(e.target.value)} placeholder={rw ? 'Andika ikibazo cyawe…' : 'Type your question…'} />
                <button aria-label={rw ? 'Ohereza' : 'Send'} disabled={!q.trim()}><Send size={15} /></button>
            </form>
        </section>}
        <button className="ai-fab" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? (rw ? 'Funga umufasha' : 'Close the assistant') : (rw ? 'Fungura umufasha' : 'Open the assistant')}>
            {open ? <X size={22} /> : <Bot size={24} />}{!open && <span>{rw ? 'Umufasha' : 'Assistant'}</span>}
        </button>
    </div>;
}
