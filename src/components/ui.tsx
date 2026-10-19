import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowUpRight, ChevronRight, Download } from 'lucide-react';
import { pathOf } from '../data/hierarchy';
import WorkspaceDialog from './WorkspaceDialog';
import WorkspaceDialog from './WorkspaceDialog';
import { buildXlsx } from '../lib/xlsx';
import type { RuleError } from '../lib/rules';

const tones: Record<string, string> = {
    // green
    Completed: 'ok', Approved: 'ok', Eligible: 'ok', Verified: 'ok', Good: 'ok', 'With Holder': 'ok', Confirmed: 'ok', Resolved: 'ok', Closed: 'ok', 'In District Store': 'ok', Received: 'ok', Lactating: 'ok', Pregnant: 'ok', ok: 'ok',
    // amber
    Submitted: 'warn', 'Pending Next Approval': 'warn', 'Pending Verification': 'warn', 'Needs Review': 'warn', Watch: 'warn', Nominated: 'warn', Dispatched: 'warn', 'Allocated (In Transit)': 'warn', Returned: 'warn', Acknowledged: 'warn', 'Handed over': 'warn', amber: 'warn', warning: 'warn', info: 'info',
    // red
    Rejected: 'bad', Disputed: 'bad', 'Not Eligible': 'bad', 'At Risk': 'bad', Deceased: 'bad', Lost: 'bad', Culled: 'bad', red: 'bad', critical: 'bad', New: 'bad', Open: 'warn',
    // neutral
    Draft: 'mute', Cancelled: 'mute', Registered: 'mute', 'Closed Chain': 'mute', 'Task created': 'mute',
};
/** A status chip. The text label is always shown, so colour is never the only signal (4.1.1). */
export function Badge({ state, label }: { state: string; label?: string }) {
    const { t } = useTranslation();
    return <span className={`badge badge-${tones[state] ?? 'mute'}`}><i aria-hidden="true" />{label ?? t(`state.${state}`, state)}</span>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
    return <header className="page-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children && <div className="page-actions">{children}</div>}</header>;
}

export function Kpi({ label, value, note, tone = 'green', to }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'green' | 'blue' | 'yellow' | 'red'; to?: string }) {
    const body = <><div className="kpi-main"><h2>{label}</h2><strong>{value}</strong></div>{note && <div className="kpi-note">{note}{to && <ArrowUpRight size={13} aria-hidden="true" />}</div>}</>;
    return to ? <Link to={to} className={`kpi kpi-${tone}`}>{body}</Link> : <div className={`kpi kpi-${tone}`}>{body}</div>;
}

export function Errors({ errors }: { errors: RuleError[] }) {
    if (!errors.length) return null;
    return <div role="alert" className="form-errors"><AlertCircle size={16} aria-hidden="true" /><ul>{errors.map((e, i) => <li key={i}><strong>{e.field}</strong>: {e.message} <small>({e.rule})</small></li>)}</ul></div>;
}

export function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
    return <label className="field"><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function Empty({ title, text }: { title: string; text?: string }) {
    return <div className="empty"><strong>{title}</strong>{text && <p>{text}</p>}</div>;
}

export function Panel({ title, aside, children, className = '' }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
    return <section className={`panel srs-panel ${className}`}>{title && <div className="srs-panel-head"><h2>{title}</h2>{aside}</div>}<div className="srs-panel-body">{children}</div></section>;
}

/** Breadcrumb of the administrative path, limited to the user's own jurisdiction (REQ-35). */
export function Crumbs({ nodeId, rootId, onPick }: { nodeId: string; rootId: string; onPick: (id: string) => void }) {
    const { t } = useTranslation();
    const path = pathOf(nodeId);
    const from = path.findIndex(n => n.id === rootId);
    return <nav aria-label="Administrative path" className="crumbs">{path.slice(Math.max(0, from)).map((n, i, arr) => <span key={n.id}>{i > 0 && <ChevronRight size={12} aria-hidden="true" />}{i === arr.length - 1 ? <b aria-current="page">{n.name}</b> : <button onClick={() => onPick(n.id)}>{n.name}</button>}<small>{t(`levels.${n.level}`)}</small></span>)}</nav>;
}

export function usePager<T>(rows: T[], size = 10) {
    const [page, setPage] = useState(1);
    const pages = Math.max(1, Math.ceil(rows.length / size));
    const current = Math.min(page, pages);
    return { rows: rows.slice((current - 1) * size, current * size), page: current, pages, setPage, total: rows.length };
}
export function Pager({ p }: { p: ReturnType<typeof usePager> }) {
    const { t } = useTranslation();
    if (p.pages <= 1) return <div className="pager"><span>{p.total}</span></div>;
    return <div className="pager"><span>{p.total}</span><div><button className="workspace-button" disabled={p.page === 1} onClick={() => p.setPage(p.page - 1)}>{t('common.previous')}</button><span>{p.page} / {p.pages}</span><button className="workspace-button" disabled={p.page === p.pages} onClick={() => p.setPage(p.page + 1)}>{t('common.next')}</button></div></div>;
}

const PREVIEW_ROWS = 15;
/** Shows what will be downloaded before it is: the columns, the first rows and the total. */
const PREVIEW_ROWS = 15;
/** Shows what will be downloaded before it is: the columns, the first rows and the total (REQ-42 adds a preview step). */
export function ExportButton({ rows, name, onExport }: { rows: string[][]; name: string; onExport?: (rows: number) => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [head, ...body] = rows;
    const confirm = (kind: 'csv' | 'print') => {
        if (kind === 'csv') downloadCsv(`${name}.csv`, rows);
        else {
            const esc = (v: string) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
            const html = `<!doctype html><meta charset="utf-8"><title>${esc(name)}</title><style>body{font:12px sans-serif}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:4px 8px;text-align:left}</style><h2>${esc(name)}</h2><table><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>${body.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
            window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
        }
        onExport?.(body.length);
        setOpen(false);
    };
    return <>
        <button className="workspace-button" onClick={() => setOpen(true)}><Download size={14} aria-hidden="true" />{t('common.export')}</button>
        {open && <WorkspaceDialog title="Preview before you download" onClose={() => setOpen(false)} wide>
            <p className="note-box">{name} · {body.length} rows · {head.length} columns. Showing the first {Math.min(PREVIEW_ROWS, body.length)}. The download is limited to your jurisdiction and is recorded in the audit trail.</p>
            <div className="table-scroll"><table className="data-table"><thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>
                {body.slice(0, PREVIEW_ROWS).map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}
                {!body.length && <tr><td colSpan={head.length}>There is nothing to export with the current filters.</td></tr>}
            </tbody></table></div>
            <div className="dialog-actions"><button className="workspace-button" onClick={() => setOpen(false)}>{t('common.cancel')}</button><button className="workspace-button" disabled={!body.length} onClick={() => confirm('print')}>Open printable view (PDF)</button><button className="workspace-button green" disabled={!body.length} onClick={() => confirm('csv')}>Download CSV</button></div>
        </WorkspaceDialog>}
    </>;
}
export function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-GB') : '-';
export const fmtDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '-';
