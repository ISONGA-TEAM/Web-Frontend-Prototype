import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MessageSquare,
    Search,
    User,
    Radio,
    Phone,
    CheckCheck,
    MoreVertical,
    Clock,
    SendHorizontal,
    Check
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const CitizenMessages: React.FC = () => {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState('MSG-1');
    const [replyText, setReplyText] = useState('');

    const messages = [
        { id: 'MSG-1', sender: 'HABIMANA Jean', category: t('messages.categories.program_query'), text: 'When is the next vaccination scheduled for my cattle?', time: '10:30 AM', unread: true, status: t('messages.status_read') },
        { id: 'MSG-2', sender: 'UWIMANA Marie', category: t('messages.categories.complaint'), text: 'I have not received the VUP payment for February yet.', time: 'Yesterday', unread: false, status: t('messages.status_delivered') },
        { id: 'MSG-3', sender: 'GAKWAYA Silas', category: t('messages.categories.asset_issue'), text: 'The roofing of the cow shed is damaged due to rain.', time: 'Mar 10', unread: false, status: t('messages.status_sent') },
        { id: 'MSG-4', sender: 'MUKAMANA Solange', category: t('messages.categories.general'), text: 'Thank you for the support, the graduation program is helpful.', time: 'Mar 08', unread: false, status: t('messages.status_read') },
    ];

    const categories = [t('messages.categories.all'), t('messages.categories.program_query'), t('messages.categories.complaint'), t('messages.categories.asset_issue'), t('messages.categories.general')];

    return (
        <div className="h-[calc(100vh-160px)] flex gap-8 animate-in fade-in duration-500">
            {/* Inbox View */}
            <div className="w-1/3 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-display font-bold text-slate-900">{t('messages.title')}</h1>
                    <button className="btn-primary p-2 rounded-xl">
                        <Radio size={20} />
                    </button>
                </div>

                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('registry.search_placeholder')}
                        className="input-field pl-10 h-11 bg-white border-slate-200"
                    />
                </div>

                <div className="card p-0 flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-50 flex gap-2">
                        {categories.slice(0, 3).map(c => (
                            <button key={c} className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                c === t('messages.categories.all') ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"
                            )}>{c}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => setSelectedId(m.id)}
                                className={cn(
                                    "p-4 cursor-pointer transition-all hover:bg-slate-50 relative group",
                                    selectedId === m.id ? "bg-slate-50 border-r-4 border-primary" : ""
                                )}
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{m.sender}</span>
                                        {m.unread && <span className="w-2 h-2 bg-primary rounded-full" />}
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400">{m.time}</span>
                                </div>
                                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">{m.category}</p>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{m.text}</p>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={14} className="text-slate-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reply Panel */}
            <div className="flex-1 card p-0 flex flex-col overflow-hidden">
                {selectedId ? (
                    <>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                                    {messages.find(m => m.id === selectedId)?.sender.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{messages.find(m => m.id === selectedId)?.sender}</h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        <CheckCheck size={14} className="text-primary" />
                                        {t('messages.resident')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2 text-slate-400 hover:text-slate-600 border border-slate-100 rounded-lg">
                                    <Phone size={18} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 border border-slate-100 rounded-lg">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-50/30">
                            <div className="flex flex-col items-center py-8 opacity-20">
                                <Clock size={48} className="text-slate-300 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">{t('messages.conversation_started')} Mar 12, 2024</p>
                            </div>

                            {/* Message from Citizen */}
                            <div className="max-w-[80%] flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-500">
                                    <User size={16} />
                                </div>
                                <div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {messages.find(m => m.id === selectedId)?.text}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">10:30 AM</span>
                                </div>
                            </div>

                            {/* System Reply */}
                            <div className="max-w-[80%] ml-auto flex flex-row-reverse gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white">
                                    <Radio size={16} />
                                </div>
                                <div className="text-right">
                                    <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-md shadow-primary/10">
                                        <p className="text-sm leading-relaxed">
                                            Muraho Jean. Twabonye ikibazo cyanyu. Muganga Silas azabasura ejo mu gitondo.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 mt-1">
                                        <span className="text-[10px] text-slate-400 font-medium tracking-tight">{t('messages.sent_via')}</span>
                                        <CheckCheck size={12} className="text-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="relative">
                                <textarea
                                    className="w-full input-field min-h-[120px] bg-slate-50 border-none resize-none pt-4 pb-12"
                                    placeholder={t('messages.reply_placeholder')}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-400">{replyText.length}/500</span>
                                    <button
                                        className="btn-primary w-10 h-10 rounded-full p-0 flex items-center justify-center shadow-lg shadow-primary/20"
                                        disabled={!replyText}
                                    >
                                        <SendHorizontal size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="w-4 h-4 rounded border-2 border-primary flex items-center justify-center transition-all bg-primary">
                                            <Check size={12} className="text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 group-hover:text-primary transition-colors">{t('messages.sms_fallback')}</span>
                                    </label>
                                </div>
                                <button className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4">
                                    <Phone size={14} />
                                    {t('messages.voice_call')}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                        <MessageSquare size={64} className="text-slate-300 mb-4" />
                        <p className="text-lg font-bold">{t('messages.select_message')}</p>
                    </div>
                )}
            </div>

            <div className="w-1/4 space-y-6">
                <div className="card bg-primary text-white border-none shadow-xl shadow-primary/20 p-6">
                    <h3 className="text-lg font-bold mb-4">{t('messages.broadcast')}</h3>
                    <p className="text-xs text-white/60 mb-6 leading-relaxed">{t('messages.broadcast_desc')}</p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">{t('registry.table.head_location')}</label>
                            <select className="w-full bg-white/10 border-white/20 rounded-lg p-2 text-sm text-white outline-none">
                                <option>Village Level</option>
                                <option>Cell Level</option>
                            </select>
                        </div>
                        <button className="w-full py-3 bg-accent text-primary font-bold rounded-xl text-sm hover:scale-105 transition-transform active:scale-95">
                            {t('messages.compose')}
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">{t('messages.delivery_status')}</h3>
                    <div className="space-y-4">
                        {[
                            { label: t('messages.status_sent'), count: 124, color: 'bg-slate-100 text-slate-600' },
                            { label: t('messages.status_delivered'), count: 118, color: 'bg-blue-50 text-blue-600' },
                            { label: t('messages.status_read'), count: 95, color: 'bg-emerald-50 text-emerald-600' }
                        ].map(s => (
                            <div key={s.label} className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">{s.label}</span>
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", s.color)}>{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CitizenMessages;
