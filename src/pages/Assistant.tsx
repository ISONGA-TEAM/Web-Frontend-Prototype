import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, PageHead, Panel, fmtDate } from '../components/ui';
import { answer, draftReport, reportKinds, scrub, suggestions, summariseNotes } from '../lib/assistant';
import type { Answer, Draft, Lang, ReportKind } from '../lib/assistant';
import { approvalDenial } from '../lib/rules';
import * as E from '../lib/engine';
import { nodeMap } from '../data/hierarchy';

interface Turn { q: string; a: Answer }

/** Mock AI assistant: Kinyarwanda or English answers and report drafts built from the user's own data. No model is called. */
export default function Assistant() {
    const { user } = useAuth();
    const { store, data, act } = useStore();
    const { i18n } = useTranslation();
    const [lang, setLang] = useState<Lang>(i18n.language === 'en' ? 'en' : 'rw');
    const [q, setQ] = useState('');
    const [turns, setTurns] = useState<Turn[]>([]);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [texts, setTexts] = useState<string[]>([]);
    const [reviewed, setReviewed] = useState(false);
    const [approved, setApproved] = useState(false);
    const [lastPrompt, setLastPrompt] = useState('');
    const u = user!;
    const mine = data.transfers.filter(t => approvalDenial(u, t) === null).length;
    const kinds = reportKinds.filter(r => r.roles.includes(u.role));
    const [kind, setKind] = useState<ReportKind>(kinds[0]?.kind ?? 'weekly_sector');
    const notes = summariseNotes(u, lang);

    const ask = (text: string) => {
        if (!text.trim()) return;
        const clean = scrub(text, store);
        setLastPrompt(clean);
        const a = answer(store, u, data, text, lang, mine);
        act((s, x) => E.logAssistant(s, x, 'question', a.intent, `prompt: ${clean} | answer: ${a.text}`));
        setTurns([...turns, { q: text, a }]); setQ('');
    };
    const submit = (e: FormEvent) => { e.preventDefault(); ask(q); };
    const generate = () => {
        const d = draftReport(store, u, data, kind, lang, mine);
        setDraft(d); setTexts(d.paragraphs.map(p => p.text)); setReviewed(false); setApproved(false);
        act((s, x) => E.logAssistant(s, x, 'draft', kind, `output: ${scrub(d.paragraphs.map(p => p.text).join(' '), store)}`));
    };
    const approve = () => { setApproved(true); act((s, x) => E.logAssistant(s, x, 'approve', kind, `approved by ${x.id}; edited: ${texts.some((t, i) => t !== draft!.paragraphs[i].text)}`)); };

    return <div className="registry-page">
        <PageHead title={lang === 'rw' ? 'Umufasha' : 'Assistant'} sub={lang === 'rw' ? 'Umufasha w’icyitegererezo usubiza mu Kinyarwanda cyangwa mu Cyongereza akoresheje amakuru y’aho ukorera gusa. Nta mashini y’ubwenge ikoreshwa hano.' : 'A mock assistant that answers in Kinyarwanda or English using only data from your jurisdiction. No language model is called in this prototype.'}>
            <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}><span>{lang === 'rw' ? 'Ururimi' : 'Language'}</span><select value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="rw">Kinyarwanda</option><option value="en">English</option></select></label>
        </PageHead>
        <div className="note-box"><Bot size={14} aria-hidden="true" /> {lang === 'rw' ? 'Imibare yose iva mu bibazo bifite amazina (Q-…) ushobora gukurikirana. Ibyanditswe ntibisohoka bitarasuzumwa kandi byemejwe nawe.' : 'Every figure comes from a named query (Q-…) you can trace. Drafts are never published until you review, edit and approve them.'}</div>

        <div className="two-col">
            <Panel title={lang === 'rw' ? 'Baza umufasha' : 'Ask the assistant'}>
                <div className="mini-actions" style={{ marginBottom: 10 }}>{suggestions[lang].map(s => <button key={s} className="workspace-button small" onClick={() => ask(s)}>{s}</button>)}</div>
                <div aria-live="polite">{turns.map((t, i) => <div key={i} style={{ marginBottom: 14 }}>
                    <p><b>{t.q}</b></p><p>{t.a.text}</p>
                    {t.a.sources.length > 0 && <details><summary>{lang === 'rw' ? 'Aho imibare yaturutse' : 'Where the figures come from'}</summary><table className="data-table"><tbody>{t.a.sources.map(s => <tr key={s.id}><td><code>{s.id}</code></td><td>{s.label}</td><td className="num">{s.value}</td><td>{s.link && <Link className="row-link" to={s.link}>{lang === 'rw' ? 'Reba' : 'Open'}</Link>}</td></tr>)}</tbody></table></details>}
                </div>)}</div>
                <form onSubmit={submit} className="mini-actions" style={{ flexWrap: 'nowrap' }}><input className="srs-input" style={{ flex: 1 }} aria-label={lang === 'rw' ? 'Ikibazo' : 'Question'} value={q} onChange={e => setQ(e.target.value)} placeholder={lang === 'rw' ? 'Andika ikibazo cyawe…' : 'Type your question…'} /><button className="workspace-button green"><Send size={14} />{lang === 'rw' ? 'Ohereza' : 'Send'}</button></form>
                {lastPrompt && <p className="registry-demo-note">{lang === 'rw' ? 'Ikibazo cyoherejwe nyuma yo gukuraho amazina n’imibare ya telefoni' : 'Prompt after personal identifiers were removed'}: “{lastPrompt}”</p>}
            </Panel>

            <Panel title={lang === 'rw' ? 'Inyandiko z’abakozi bo mu midugudu (icyitegererezo)' : 'Village field notes (mock data)'}>
                <p className="registry-demo-note">{notes.count} {lang === 'rw' ? 'inyandiko mu karere kawe' : 'notes in your jurisdiction'}</p>
                {notes.notes.map(n => <p key={n.id} lang="rw"><Badge state="info" label={nodeMap[n.villageId]?.name ?? n.villageId} /> {n.text}<br /><small>{lang === 'en' ? n.en : ''}</small></p>)}
                {!notes.notes.length && <p>{lang === 'rw' ? 'Nta nyandiko ihari.' : 'No notes for your jurisdiction.'}</p>}
            </Panel>
        </div>

        {kinds.length > 0 && <Panel title={lang === 'rw' ? 'Gukora raporo' : 'Draft a report'} aside={draft && <Badge state={approved ? 'Approved' : 'Pending Verification'} label={approved ? (lang === 'rw' ? 'Yemejwe' : 'Approved') : (lang === 'rw' ? 'Igitabo cy’umufasha cyitaremezwa' : 'AI-assisted draft')} />}>
            <div className="mini-actions"><select aria-label="Report" value={kind} onChange={e => setKind(e.target.value as ReportKind)}>{kinds.map(r => <option key={r.kind} value={r.kind}>{r[lang]}</option>)}</select><button className="workspace-button green" onClick={generate}>{lang === 'rw' ? 'Kora igitabo' : 'Generate draft'}</button></div>
            {draft && <div style={{ marginTop: 14 }}>
                {draft.paragraphs.map((p, i) => <div key={i} className="field" style={{ marginBottom: 12 }}>
                    <textarea aria-label={`Paragraph ${i + 1}`} value={texts[i]} disabled={approved} onChange={e => setTexts(texts.map((t, k) => k === i ? e.target.value : t))} rows={3} />
                    {p.sources.length > 0 && <small>{lang === 'rw' ? 'Imibare: ' : 'Figures: '}{p.sources.map(s => s.id).join(', ')}</small>}
                </div>)}
                <p className="registry-demo-note">{lang === 'rw' ? 'Byakozwe' : 'Generated'} {fmtDate(draft.generatedAt)}. {lang === 'rw' ? 'Nta gitabo gisohoka mu buryo bwikora.' : 'Nothing is published automatically.'}</p>
                {!approved && <><label className="check-row"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />{lang === 'rw' ? 'Nasomye kandi nzi ko imibare ihuye n’amakuru ya sisitemu' : 'I reviewed this draft and checked the figures against the dashboard'}</label>
                    <div className="dialog-actions"><button className="workspace-button" onClick={() => window.print()}>{lang === 'rw' ? 'Andika / PDF' : 'Print / PDF'}</button><button className="workspace-button green" disabled={!reviewed} onClick={approve}>{lang === 'rw' ? 'Emeza raporo' : 'Approve report'}</button></div></>}
                {approved && <p className="form-ok">{lang === 'rw' ? 'Raporo yemejwe kandi byanditswe mu mateka y’ibikorwa.' : 'Approved and recorded in the audit trail.'}</p>}
            </div>}
        </Panel>}
        <p className="registry-demo-note">{lang === 'rw' ? 'Amakuru y’icyitegererezo. Ibisobanuro bya Kinyarwanda ni igitabo cy’ibanze gikeneye gusuzumwa n’umuhanga mu rurimi.' : 'Fictional data. The Kinyarwanda text is a first draft that needs review by a native speaker.'}</p>
    </div>;
}
