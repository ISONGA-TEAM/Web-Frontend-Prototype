import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Eye, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { demoHouseholds } from '../data/households';
import { speciesOptions, formatDemoDate } from '../data/workspace';
import type { Animal, CalfTransfer, Species, AnimalStatus } from '../data/workspace';
import WorkspaceDialog from './WorkspaceDialog';

type RegistryRecord = Animal | CalfTransfer;
const pageSize = 7;

export default function RegistryTable({ mode }: { mode: 'livestock' | 'transfers' }) {
    const livestock = mode === 'livestock';
    const { animals, transfers, addAnimal, removeAnimal, removeTransfer } = useWorkspace();
    const { i18n } = useTranslation();
    const rw = i18n.language === 'rw';
    const [search, setSearch] = useState('');
    const [species, setSpecies] = useState('');
    const [sector, setSector] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<string[]>([]);
    const [detail, setDetail] = useState<RegistryRecord | null>(null);
    const [deleting, setDeleting] = useState<RegistryRecord | null>(null);
    const [adding, setAdding] = useState(false);
    const [notice, setNotice] = useState('');
    const records: RegistryRecord[] = livestock ? animals : transfers;
    const filtered = records.filter(record => {
        const text = 'name' in record ? `${record.name} ${record.email} ${record.sector}` : `${record.from} ${record.to}`;
        return `${record.id} ${record.species} ${record.breed} ${text}`.toLowerCase().includes(search.trim().toLowerCase()) && (!species || record.species === species) && (!status || record.status === status) && (!sector || ('sector' in record && record.sector === sector));
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const filterChanged = (set: (value: string) => void, value: string) => { set(value); setPage(1); setSelected([]); };
    const clearFilters = () => { setSearch(''); setSpecies(''); setSector(''); setStatus(''); setPage(1); setSelected([]); };
    const statusLabel = (value: string) => rw ? ({ Active: 'Birakora', 'Under care': 'Biravurwa', Transferred: 'Byatanzwe', Approved: 'Byemejwe', Pending: 'Birategereje', Rejected: 'Byanzwe' }[value] || value) : value;
    const toggleSelected = (id: string) => setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
    const saveAnimal = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const household = demoHouseholds.find(item => item.id === form.get('household'))!;
        const animal: Animal = { id: `LV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, householdId: household.id, name: household.headName, email: `household${demoHouseholds.indexOf(household) + 1}@example.com`, sector: household.location.sector, species: form.get('species') as Species, breed: String(form.get('breed')).trim(), status: form.get('status') as AnimalStatus, date: new Date().toISOString().slice(0, 10) };
        if (!animal.breed) return;
        addAnimal(animal); setAdding(false); clearFilters(); setNotice(rw ? 'Itungo ryanditswe.' : `${animal.id} added to the livestock registry.`);
    };
    return <div className="registry-page">
        <div className="registry-toolbar"><div className="registry-search"><Search size={17} strokeWidth={1.6} /><input aria-label={livestock ? 'Search livestock' : 'Search transfers'} placeholder={rw ? 'Shakisha' : 'Search'} value={search} onChange={event => filterChanged(setSearch, event.target.value)} />{search && <button className="icon-button" aria-label="Clear search" onClick={() => filterChanged(setSearch, '')}><X size={14} /></button>}</div>
            <div className="registry-filters">{livestock && <><select aria-label="Filter species" value={species} onChange={event => filterChanged(setSpecies, event.target.value)}><option value="">{rw ? 'Amoko yose' : 'All Species'}</option>{speciesOptions.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Filter sectors" value={sector} onChange={event => filterChanged(setSector, event.target.value)}><option value="">{rw ? 'Imirenge yose' : 'All Sectors'}</option>{[...new Set(demoHouseholds.map(item => item.location.sector))].map(item => <option key={item}>{item}</option>)}</select></>}
                <select aria-label={livestock ? 'Filter status' : 'Filter transfers'} className={!livestock ? 'transfer-filter' : ''} value={status} onChange={event => filterChanged(setStatus, event.target.value)}><option value="">{livestock ? (rw ? 'Imiterere yose' : 'All Status') : (rw ? 'Inyana zose' : 'All Transfers')}</option>{(livestock ? ['Active', 'Under care', 'Transferred'] : ['Approved', 'Rejected', 'Pending']).map(item => <option value={item} key={item}>{statusLabel(item)}</option>)}</select>
                {livestock && <button className="workspace-button green" onClick={() => setAdding(true)}><Plus size={17} />{rw ? 'Ongeraho itungo' : 'Add Livestock'}</button>}
            </div>
        </div>
        {notice && <div className="registry-notice" role="status">{notice}<button className="icon-button" aria-label="Dismiss" onClick={() => setNotice('')}><X size={14} /></button></div>}
        {livestock && <div className="livestock-stats">{speciesOptions.map((item, index) => <button key={item} onClick={() => filterChanged(setSpecies, species === item ? '' : item)} aria-pressed={species === item} className={`animal-summary ${['blue', 'yellow', 'green', 'blue'][index]} ${species === item ? 'selected' : ''}`}><span>{rw ? ['Inka', 'Ihene', 'Inkoko', 'Intama'][index] : item}</span><strong>{animals.filter(animal => animal.species === item).length}</strong></button>)}</div>}
        {(search || species || sector || status || selected.length > 0) && <div className="registry-results"><span>{filtered.length} {rw ? 'byabonetse' : 'results'}{selected.length > 0 ? ` · ${selected.length} ${rw ? 'byatoranyijwe' : 'selected'}` : ''}</span><button onClick={clearFilters}>{rw ? 'Siba amahitamo' : 'Clear filters & selection'}</button></div>}
        <div className="registry-table-panel panel"><div className="registry-table-scroll"><table className={`registry-table ${livestock ? 'animals-table' : 'transfers-table'}`}><thead><tr><th><div className="table-name"><input type="checkbox" aria-label="Select all records on this page" checked={visible.length > 0 && visible.every(record => selected.includes(record.id))} onChange={event => setSelected(previous => event.target.checked ? [...new Set([...previous, ...visible.map(record => record.id)])] : previous.filter(id => !visible.some(record => record.id === id)))} /><span>{livestock ? (rw ? 'Izina' : 'Name') : (rw ? 'Uwayitanze' : 'From')}</span></div></th><th>{livestock ? (rw ? 'Itariki' : 'Date Submitted') : (rw ? 'Uwayihawe' : 'To')}</th><th>{rw ? 'Ubwoko' : 'Species'}</th><th>{rw ? 'Icyororo' : 'Type'}</th><th>{rw ? 'Imiterere' : 'Status'}</th>{!livestock && <th>{rw ? 'Yanditswe' : 'Registered On'}</th>}<th className="actions-heading">{rw ? 'Ibikorwa' : 'Actions'}</th></tr></thead>
            <tbody>{visible.map(record => <tr key={record.id}><td><div className="table-name"><input type="checkbox" aria-label={`Select ${record.id}`} checked={selected.includes(record.id)} onChange={() => toggleSelected(record.id)} /><div><span>{'name' in record ? record.name : record.from}</span>{'email' in record && <small>{record.email}</small>}</div></div></td><td>{'name' in record ? formatDemoDate(record.date) : record.to}</td><td className="muted-cell">{record.species}</td><td className="muted-cell">{record.breed}</td><td><span className={`record-status status-${record.status.toLowerCase().replaceAll(' ', '-')}`}><i />{statusLabel(record.status)}</span></td>{!livestock && <td className="date-cell">{formatDemoDate(record.date)}</td>}<td><div className="row-actions"><button className="icon-button view-button" aria-label={`View ${record.id}`} onClick={() => setDetail(record)}><Eye size={17} strokeWidth={1.5} /></button><button className="icon-button delete-button" aria-label={`Delete ${record.id}`} onClick={() => setDeleting(record)}><Trash2 size={16} strokeWidth={1.5} /></button></div></td></tr>)}{visible.length === 0 && <tr><td colSpan={livestock ? 6 : 7} className="registry-empty"><Search size={25} /><strong>{rw ? 'Nta byabonetse' : 'No matching records'}</strong><p>{rw ? 'Hindura ibyo ushakisha.' : 'Try another name or clear your filters.'}</p><button className="workspace-button" onClick={clearFilters}>{rw ? 'Siba amahitamo' : 'Clear filters'}</button></td></tr>}</tbody>
        </table></div><div className="table-pagination"><div><button className="workspace-button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => { setPage(currentPage - 1); setSelected([]); }}><ChevronLeft size={15} />{rw ? 'Ibanza' : 'Previous'}</button><button className="workspace-button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => { setPage(currentPage + 1); setSelected([]); }}>{rw ? 'Ikurikira' : 'Next'}<ChevronRight size={15} /></button></div><span>{rw ? 'Urupapuro' : 'Page'} {currentPage} {rw ? 'muri' : 'of'} {totalPages}</span></div></div>
        <p className="registry-demo-note">{rw ? 'Amakuru y’icyitegererezo · Impinduka zirangira iyo wongeye gufungura urupapuro' : 'Demo workspace · Changes reset when you refresh'}</p>
        {detail && <WorkspaceDialog title={`${livestock ? (rw ? 'Itungo' : 'Livestock record') : (rw ? 'Inyana yatanzwe' : 'Calf transfer')} · ${detail.id}`} onClose={() => setDetail(null)}><dl className="record-details">{('name' in detail ? [['Household', detail.name], ['Sector', detail.sector], ['Email', detail.email]] : [['From', detail.from], ['To', detail.to], ['Animal ID', detail.animalId]]).concat([['Species', detail.species], ['Type', detail.breed], ['Status', statusLabel(detail.status)], ['Registered on', formatDemoDate(detail.date)]]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{'householdId' in detail && <Link className="workspace-button green" to={`/households/${detail.householdId}`}>{rw ? 'Reba umuryango' : 'View household'}<ChevronRight size={16} /></Link>}</WorkspaceDialog>}
        {deleting && <WorkspaceDialog title={rw ? 'Siba inyandiko?' : 'Delete this record?'} onClose={() => setDeleting(null)}><div className="dialog-body"><p>{deleting.id} · {'name' in deleting ? deleting.name : `${deleting.from} → ${deleting.to}`}</p><p>{rw ? 'Iyi nyandiko izakurwa muri iki cyitegererezo.' : 'This record will be removed from the current demo session.'}</p></div><div className="dialog-actions"><button className="workspace-button" onClick={() => setDeleting(null)}>{rw ? 'Reka' : 'Cancel'}</button><button className="workspace-button danger" onClick={() => { if (livestock) removeAnimal(deleting.id); else removeTransfer(deleting.id); setSelected(previous => previous.filter(id => id !== deleting.id)); setNotice(`${deleting.id} ${rw ? 'yasibwe.' : 'deleted.'}`); setDeleting(null); }}>{rw ? 'Siba' : 'Delete record'}</button></div></WorkspaceDialog>}
        {adding && <WorkspaceDialog title={rw ? 'Ongeraho itungo' : 'Add Livestock'} onClose={() => setAdding(false)}><form className="animal-form" onSubmit={saveAnimal}><label>{rw ? 'Umuryango' : 'Household'}<select required name="household" defaultValue=""><option value="" disabled>{rw ? 'Hitamo umuryango' : 'Choose a household'}</option>{demoHouseholds.map(household => <option key={household.id} value={household.id}>{household.headName} · {household.id}</option>)}</select></label><div className="form-columns"><label>{rw ? 'Ubwoko' : 'Species'}<select name="species">{speciesOptions.map(item => <option key={item}>{item}</option>)}</select></label><label>{rw ? 'Imiterere' : 'Status'}<select name="status">{['Active', 'Under care', 'Transferred'].map(item => <option value={item} key={item}>{statusLabel(item)}</option>)}</select></label></div><label>{rw ? 'Icyororo' : 'Type / breed'}<input name="breed" required maxLength={80} pattern=".*\S.*" placeholder="e.g. Inyambo" /></label><p className="registry-demo-note">{rw ? 'Umurenge uzava ku muryango wahisemo.' : 'The sector is taken from the selected household.'}</p><div className="dialog-actions"><button type="button" className="workspace-button" onClick={() => setAdding(false)}>{rw ? 'Reka' : 'Cancel'}</button><button className="workspace-button green" type="submit"><Plus size={16} />{rw ? 'Andika itungo' : 'Save livestock'}</button></div></form></WorkspaceDialog>}
    </div>;
}
