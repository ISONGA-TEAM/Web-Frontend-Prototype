import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Badge, Errors, Field, PageHead, Panel, Pager, usePager } from '../components/ui';
import * as E from '../lib/engine';
import { childrenOf, nodeMap, pathOf } from '../data/hierarchy';
import type { RuleError } from '../lib/rules';
import type { Config, Role } from '../types';

const configFields: { key: keyof Config; label: string; unit: string }[] = [
    { key: 'passOnAgeMonths', label: 'Pass-on age', unit: 'months' }, { key: 'replacementWindowMonths', label: 'Replacement window', unit: 'months' },
    { key: 'receiptHours', label: 'Receipt must be confirmed within', unit: 'hours' }, { key: 'passOnAmberDays', label: 'Pass-on overdue (amber) after', unit: 'days' },
    { key: 'passOnRedDays', label: 'Pass-on critical (red) after', unit: 'days' }, { key: 'exitVerifyDays', label: 'Death verified within', unit: 'days' },
    { key: 'approvalBacklog', label: 'Sector approval backlog above', unit: 'transfers' }, { key: 'visitCoveragePct', label: 'Monitoring visit coverage below', unit: '%' },
    { key: 'visitIntervalDays', label: 'Visit interval', unit: 'days' }, { key: 'vaccineIntervalDays', label: 'Vaccination interval', unit: 'days' },
];

/** Administration: hierarchy master data, staff accounts and MINALOC-configured thresholds. No household personal data is shown here. */
export default function Admin() {
    const { user } = useAuth();
    const { store, act } = useStore();
    const { t } = useTranslation();
    const admin = user!.role === 'system_admin';
    const [tab, setTab] = useState<'config' | 'hierarchy' | 'users'>('config');
    const [node, setNode] = useState('RW');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [notice, setNotice] = useState('');
    const [q, setQ] = useState('');
    const staff = store.users.filter(u => u.role !== 'household' && `${u.name} ${u.username} ${u.role}`.toLowerCase().includes(q.toLowerCase()));
    const pager = usePager(staff, 12);
    const save = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        const patch = Object.fromEntries(configFields.map(c => [c.key, Number(f.get(c.key))])) as Partial<Config>;
        const r = act((s, u) => E.setConfig(s, u, patch));
        if (!r.ok) setErrors(r.errors); else { setErrors([]); setNotice('Thresholds saved. They apply immediately, without a software release.'); }
    };
    const countBy = (id: string) => childrenOf(id).length;
    const tabs: ['config' | 'hierarchy' | 'users', string][] = [['config', 'Thresholds'], ...(admin ? [['hierarchy', 'Hierarchy'], ['users', 'Staff accounts']] as ['hierarchy' | 'users', string][] : [])];
    return <div className="registry-page">
        <PageHead title={t('nav.admin')} sub="Thresholds are set by MINALOC and can be changed without a release. Only the System Administrator manages the hierarchy. All changes are audited." />
        <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
        {notice && <p className="form-ok" role="status">{notice}</p>}
        {tab === 'config' && <Panel title="Rules and thresholds"><form className="animal-form" onSubmit={save}><div className="form-grid">
            {configFields.map(c => <Field key={c.key} label={`${c.label} (${c.unit})`}><input name={c.key} type="number" min={1} defaultValue={store.config[c.key]} disabled={!(admin || user!.role === 'national_officer')} /></Field>)}</div>
            <Errors errors={errors} /><div className="dialog-actions"><button className="workspace-button green">Save thresholds</button></div></form></Panel>}
        {tab === 'hierarchy' && <Panel title="Administrative tree">
            <nav className="crumbs">{pathOf(node).map((n, i, a) => <span key={n.id}>{i > 0 && <ChevronRight size={12} />}{i === a.length - 1 ? <b>{n.name}</b> : <button onClick={() => setNode(n.id)}>{n.name}</button>}</span>)}</nav>
            <table className="data-table"><thead><tr><th>Name</th><th>Level</th><th>Code</th><th className="num">Children</th><th>Status</th></tr></thead><tbody>{childrenOf(node).map(c => <tr key={c.id}><td>{countBy(c.id) ? <button className="row-link" onClick={() => setNode(c.id)}>{c.name}</button> : c.name}</td><td>{t(`levels.${c.level}`)}</td><td>{c.code}</td><td className="num">{countBy(c.id)}</td><td><Badge state="ok" label={c.status} /></td></tr>)}{!childrenOf(node).length && <tr><td colSpan={5}>No child nodes. Villages are the lowest level.</td></tr>}</tbody></table>
            <p className="registry-demo-note">Only the Nyabihu pilot district is populated. Codes are placeholders until MINALOC supplies the LODA register. Creating, renaming and retiring nodes keeps history and is audited.</p></Panel>}
        {tab === 'users' && <Panel title="Staff accounts">
            <div className="registry-search" style={{ marginBottom: 10 }}><input aria-label="Search staff" placeholder={t('common.search')} value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="table-scroll"><table className="data-table"><thead><tr><th>Name</th><th>Role</th><th>Jurisdiction</th><th>Username</th></tr></thead><tbody>{pager.rows.map(u => <tr key={u.id}><td>{u.name}</td><td>{t(`roles.${u.role as Role}`)}</td><td>{nodeMap[u.nodeId].name}</td><td>{u.username}</td></tr>)}</tbody></table></div><Pager p={pager} />
            <p className="registry-demo-note">Accounts are created by invitation to a government address that expires after 48 hours. Invitations are not simulated in this prototype.</p></Panel>}
    </div>;
}
