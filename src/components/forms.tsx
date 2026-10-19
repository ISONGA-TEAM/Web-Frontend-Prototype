// Data-entry dialogs shared by several pages. Each one calls an engine action and shows the rule errors it returns.
import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import WorkspaceDialog from './WorkspaceDialog';
import { Errors, Field } from './ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import * as E from '../lib/engine';
import { holderLabel, passOnTasks, validateTransfer, transferTypes, holdsAny } from '../lib/rules';
import type { RuleError, TransferInput } from '../lib/rules';
import { ancestorAt, descendantsOf, nodeMap, storeOf } from '../data/hierarchy';
import { evidenceTypes, girinkaCriteria, productList, vulnerabilityOptions } from '../data/criteria';
import type { Animal, HealthEvent, HolderRef, TransferType } from '../types';

interface DialogProps { onClose: () => void; onDone: (message: string, id?: string) => void }
const today = () => new Date().toISOString().slice(0, 10);

function Shell({ title, onClose, onSubmit, errors, submit, wide, children, warnings }: { title: string; onClose: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void; errors: RuleError[]; submit: string; wide?: boolean; children: ReactNode; warnings?: string[] }) {
    const { t } = useTranslation();
    return <WorkspaceDialog title={title} onClose={onClose} wide={wide}>
        <form className="animal-form" onSubmit={onSubmit} noValidate>
            {children}
            {warnings?.map(w => <p className="form-warn" key={w}>{w}</p>)}
            <Errors errors={errors} />
            <div className="dialog-actions"><button type="button" className="workspace-button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="workspace-button green">{submit}</button></div>
        </form>
    </WorkspaceDialog>;
}

export function RegisterHouseholdDialog({ onClose, onDone }: DialogProps) {
    const { user } = useAuth(); const { act } = useStore();
    const villages = useMemo(() => descendantsOf(user!.nodeId, 'village').concat(nodeMap[user!.nodeId].level === 'village' ? [nodeMap[user!.nodeId]] : []), [user]);
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [vul, setVul] = useState<string[]>([]);
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = act((s, u) => E.registerHousehold(s, u, { headName: String(f.get('headName')), nid: String(f.get('nid')), sex: f.get('sex') as 'F' | 'M', dob: String(f.get('dob')), size: Number(f.get('size')), villageId: String(f.get('villageId')), phone: String(f.get('phone')), shelter: String(f.get('shelter')), vulnerability: vul }));
        if (!r.ok) { setErrors(r.errors); return; }
        if (r.warnings?.length && warnings.length === 0) { setWarnings(r.warnings); }
        onDone(`${r.id} registered with status Registered.${r.warnings?.length ? ' ' + r.warnings[0] : ''}`, r.id);
    };
    return <Shell title="Register a household" onClose={onClose} onSubmit={submit} errors={errors} warnings={warnings} submit="Register household" wide>
        <p className="note-box">Purpose: personal data is collected only for Girinka programme delivery approved by MINALOC. Fields marked * are required; the household is told this before consent is recorded.</p>
        <div className="form-grid">
            <Field label="Household head name" required><input name="headName" required maxLength={80} /></Field>
            <Field label="National ID reference" required hint="16 digits"><input name="nid" inputMode="numeric" maxLength={16} required /></Field>
            <Field label="Sex" required><select name="sex"><option value="F">Female</option><option value="M">Male</option></select></Field>
            <Field label="Date of birth" required><input name="dob" type="date" required max={today()} /></Field>
            <Field label="Household size" required><input name="size" type="number" min={1} max={30} defaultValue={4} /></Field>
            <Field label="Village" required><select name="villageId" defaultValue={villages[0]?.id}>{villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
            <Field label="Contact phone" required hint="Stored encrypted; shown only to assigned officers"><input name="phone" inputMode="tel" required /></Field>
            <Field label="Land and shelter description"><input name="shelter" maxLength={160} /></Field>
            <div className="wide"><span className="field"><span>Vulnerability indicators</span></span><div className="check-row">{vulnerabilityOptions.map(o => <label key={o}><input type="checkbox" checked={vul.includes(o)} onChange={ev => setVul(ev.target.checked ? [...vul, o] : vul.filter(x => x !== o))} />{o}</label>)}</div></div>
        </div>
    </Shell>;
}

export function AssessDialog({ householdId, onClose, onDone }: DialogProps & { householdId: string }) {
    const { act } = useStore(); const { i18n } = useTranslation();
    const [answers, setAnswers] = useState(girinkaCriteria.map(c => ({ key: c.key as string, answer: true, evidence: 'document' as (typeof evidenceTypes)[number] })));
    const [errors, setErrors] = useState<RuleError[]>([]);
    const preview = answers.some(a => !a.answer) ? 'Not Eligible' : answers.some(a => a.evidence === 'none') ? 'Needs Review' : 'Eligible';
    const submit = (e: FormEvent) => { e.preventDefault(); const r = act((s, u) => E.assessHousehold(s, u, householdId, answers)); if (!r.ok) setErrors(r.errors); else onDone(`Assessment recorded: ${preview}.`); };
    return <Shell title="Eligibility assessment" onClose={onClose} onSubmit={submit} errors={errors} submit="Record assessment" wide>
        <p className="note-box">These criteria are placeholders. MINALOC configures the real Girinka criteria (REQ-08); each answer stores its evidence type and your ID.</p>
        {girinkaCriteria.map((c, i) => <div className="form-grid" key={c.key}>
            <Field label={i18n.language === 'rw' ? c.rw : c.en}><select value={answers[i].answer ? 'yes' : 'no'} onChange={ev => setAnswers(answers.map((a, k) => k === i ? { ...a, answer: ev.target.value === 'yes' } : a))}><option value="yes">Yes</option><option value="no">No</option></select></Field>
            <Field label="Evidence"><select value={answers[i].evidence} onChange={ev => setAnswers(answers.map((a, k) => k === i ? { ...a, evidence: ev.target.value as typeof a.evidence } : a))}>{evidenceTypes.map(x => <option key={x} value={x}>{x}</option>)}</select></Field>
        </div>)}
        <p>Result: <strong>{preview}</strong></p>
    </Shell>;
}

export function RegisterAnimalDialog({ onClose, onDone }: DialogProps) {
    const { act } = useStore();
    const [errors, setErrors] = useState<RuleError[]>([]);
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        const r = act((s, u) => E.registerAnimal(s, u, { tag: String(f.get('tag')), breed: String(f.get('breed')), sex: f.get('sex') as 'Female' | 'Male', dob: String(f.get('dob')), dobEstimated: f.get('est') === 'on', colour: String(f.get('colour')), source: String(f.get('source')) }));
        if (!r.ok) setErrors(r.errors); else onDone(`Animal registered in the district store (${r.id}).`, r.id);
    };
    return <Shell title="Register an animal at the district store" onClose={onClose} onSubmit={submit} errors={errors} submit="Register animal" wide>
        <div className="form-grid">
            <Field label="Tag number" required hint="Unique across the programme and never reused"><input name="tag" required maxLength={20} /></Field>
            <Field label="Breed" required><input name="breed" required defaultValue="Friesian cross" /></Field>
            <Field label="Sex"><select name="sex"><option>Female</option><option>Male</option></select></Field>
            <Field label="Date of birth" required><input name="dob" type="date" required max={today()} /></Field>
            <Field label="Colour and markings"><input name="colour" /></Field>
            <Field label="Source"><select name="source"><option>Supplier</option><option>District herd</option><option>Other</option></select></Field>
            <label className="check-row wide"><input type="checkbox" name="est" /> Date of birth is an estimate</label>
        </div>
        <p className="registry-demo-note">Photo capture is part of the field app; it is not simulated here.</p>
    </Shell>;
}

export function RecordCalvingDialog({ damId, onClose, onDone }: DialogProps & { damId?: string }) {
    const { act, data } = useStore();
    const dams = data.animals.filter(a => a.sex === 'Female' && a.holder.kind === 'household' && ['With Holder', 'Pregnant', 'Lactating'].includes(a.status));
    const [dam, setDam] = useState(damId ?? dams[0]?.id ?? '');
    const [calves, setCalves] = useState([{ sex: 'Female' as 'Female' | 'Male', weight: 25, tag: '' }]);
    const [date, setDate] = useState(today());
    const [comp, setComp] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const submit = (e: FormEvent) => { e.preventDefault(); const r = act((s, u) => E.recordCalving(s, u, { damId: dam, date, calves, complications: comp })); if (!r.ok) setErrors(r.errors); else onDone(`Calving recorded.${comp ? ' The Sector Veterinary Officer is notified of the complication.' : ''} Tag each calf within 7 days.`, r.id); };
    return <Shell title="Register a calving" onClose={onClose} onSubmit={submit} errors={errors} submit="Record calving" wide>
        <div className="form-grid">
            <Field label="Dam (cow)" required><select value={dam} onChange={e => setDam(e.target.value)}>{dams.map(a => <option key={a.id} value={a.id}>{a.tag} · {a.status}</option>)}</select></Field>
            <Field label="Calving date" required><input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} /></Field>
            {calves.map((c, i) => <div className="form-grid wide" key={i}>
                <Field label={`Calf ${i + 1} sex`}><select value={c.sex} onChange={e => setCalves(calves.map((x, k) => k === i ? { ...x, sex: e.target.value as 'Female' | 'Male' } : x))}><option>Female</option><option>Male</option></select></Field>
                <Field label="Weight (kg)"><input type="number" min={5} max={80} value={c.weight} onChange={e => setCalves(calves.map((x, k) => k === i ? { ...x, weight: Number(e.target.value) } : x))} /></Field>
                <Field label="Tag (fit within 7 days)" hint="Leave blank to tag later"><input value={c.tag} onChange={e => setCalves(calves.map((x, k) => k === i ? { ...x, tag: e.target.value } : x))} /></Field>
                {calves.length > 1 && <button type="button" className="workspace-button small" onClick={() => setCalves(calves.filter((_, k) => k !== i))}><Trash2 size={13} />Remove calf</button>}
            </div>)}
            {calves.length < 2 && <button type="button" className="workspace-button small" onClick={() => setCalves([...calves, { sex: 'Female', weight: 22, tag: '' }])}><Plus size={13} />Add twin</button>}
            <Field label="Complications (leave empty if none)"><textarea value={comp} onChange={e => setComp(e.target.value)} /></Field>
        </div>
    </Shell>;
}

export function RecordHealthDialog({ animalId, onClose, onDone }: DialogProps & { animalId?: string }) {
    const { act, data } = useStore();
    const animals = data.animals.filter(a => a.holder.kind === 'household' && !['Deceased', 'Lost', 'Culled', 'Closed Chain'].includes(a.status));
    const [animal, setAnimal] = useState(animalId ?? animals[0]?.id ?? '');
    const [type, setType] = useState<HealthEvent['type']>('vaccination');
    const [product, setProduct] = useState<string>(productList.vaccination[0]);
    const [errors, setErrors] = useState<RuleError[]>([]);
    const [score, setScore] = useState(3);
    const [date, setDate] = useState(today());
    const [dose, setDose] = useState('');
    const [remarks, setRemarks] = useState('');
    const submit = (e: FormEvent) => { e.preventDefault(); const r = act((s, u) => E.recordHealth(s, u, { animalId: animal, type, date, product, dose, score: type === 'body_condition' ? score : undefined, remarks })); if (!r.ok) setErrors(r.errors); else onDone('Health event recorded.'); };
    return <Shell title="Record a health event" onClose={onClose} onSubmit={submit} errors={errors} submit="Save event">
        <p className="note-box">The system records events and shows the configured schedule. It does not give dosing or treatment advice.</p>
        <Field label="Animal" required><select value={animal} onChange={e => setAnimal(e.target.value)}>{animals.map(a => <option key={a.id} value={a.id}>{a.tag}</option>)}</select></Field>
        <Field label="Event type"><select value={type} onChange={e => { const t = e.target.value as HealthEvent['type']; setType(t); setProduct(productList[t][0]); }}>{Object.keys(productList).map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}</select></Field>
        <Field label={type === 'pregnancy_check' ? 'Service / insemination date' : 'Date'} required><input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Product / diagnosis code" required hint="Chosen from the configured list"><select value={product} onChange={e => setProduct(e.target.value)}>{(productList[type] as readonly string[]).map(p => <option key={p}>{p}</option>)}</select></Field>
        {type === 'body_condition' ? <Field label="Body condition score (1 to 5)"><input type="number" min={1} max={5} value={score} onChange={e => setScore(Number(e.target.value))} /></Field> : <Field label="Dose (from the schedule)"><input value={dose} onChange={e => setDose(e.target.value)} /></Field>}
        <Field label="Remarks"><textarea value={remarks} onChange={e => setRemarks(e.target.value)} /></Field>
    </Shell>;
}

export function RecordExitDialog({ animalId, onClose, onDone }: DialogProps & { animalId: string }) {
    const { act } = useStore();
    const [errors, setErrors] = useState<RuleError[]>([]);
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        const r = act((s, u) => E.recordExit(s, u, { animalId, date: String(f.get('date')), category: f.get('category') as 'death', cause: String(f.get('cause')), evidence: f.get('evidence') as 'photo' }));
        if (!r.ok) setErrors(r.errors); else onDone('Exit event recorded. Without a vet certificate it stays Pending Verification and the Sector Veterinary Officer has 14 days to verify it.', r.id);
    };
    return <Shell title="Record death, loss or cull" onClose={onClose} onSubmit={submit} errors={errors} submit="Record exit">
        <Field label="Category"><select name="category"><option value="death">Death</option><option value="loss">Loss</option><option value="cull">Cull (needs a vet certificate)</option></select></Field>
        <Field label="Date" required><input name="date" type="date" defaultValue={today()} max={today()} /></Field>
        <Field label="Cause" required><textarea name="cause" /></Field>
        <Field label="Evidence type" required><select name="evidence"><option value="vet_certificate">Vet certificate</option><option value="photo">Photo</option><option value="witness_statement">Witness statement</option><option value="cell_report">Cell report</option></select></Field>
        <p className="registry-demo-note">Exit events cannot be deleted. A wrong entry is corrected by a reversal event.</p>
    </Shell>;
}

export function VisitDialog({ householdId, onClose, onDone }: DialogProps & { householdId: string }) {
    const { act } = useStore();
    const [errors, setErrors] = useState<RuleError[]>([]);
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        const r = act((s, u) => E.recordVisit(s, u, { householdId, shelter: f.get('shelter') as 'good', animal: f.get('animal') as 'good', feedWater: f.get('feedWater') as 'good', issues: String(f.get('issues')) }));
        if (!r.ok) setErrors(r.errors); else onDone('Monitoring visit recorded.');
    };
    const rating = (name: string, label: string) => <Field label={label}><select name={name} defaultValue="good"><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></Field>;
    return <Shell title="Record a monitoring visit" onClose={onClose} onSubmit={submit} errors={errors} submit="Save visit">
        {rating('shelter', 'Shelter condition')}{rating('animal', 'Animal condition')}{rating('feedWater', 'Feed and water')}
        <Field label="Issues"><textarea name="issues" /></Field>
        <p className="registry-demo-note">Two consecutive poor animal-condition scores alert the Sector Officer.</p>
    </Shell>;
}

// ---------- Transfer wizard (4 steps, 4.1) ----------
const needsHouseholdReceiver = (t: TransferType) => ['primary', 'pass_on', 'replacement', 'move'].includes(t);
export function TransferWizard({ onClose, onDone, presetAnimal }: DialogProps & { presetAnimal?: string }) {
    const { act, store, data } = useStore(); const { user } = useAuth(); const { t } = useTranslation();
    const [step, setStep] = useState(presetAnimal ? 1 : 0);
    const [type, setType] = useState<TransferType>(presetAnimal && store.animals.find(a => a.id === presetAnimal)?.damId ? 'pass_on' : 'primary');
    const [animalId, setAnimalId] = useState(presetAnimal ?? '');
    const [toId, setToId] = useState('');
    const [date, setDate] = useState(today());
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState<RuleError[]>([]);
    const creatable = transferTypes.filter(x => x !== 'reversal');
    const tasks = useMemo(() => passOnTasks(store), [store]);
    const candidates: Animal[] = data.animals.filter(a => {
        if (type === 'primary' || type === 'replacement') return a.status === 'In District Store';
        if (type === 'pass_on') return tasks.some(tk => tk.calfId === a.id && tk.due);
        return ['With Holder', 'Pregnant', 'Lactating'].includes(a.status) && a.holder.kind === 'household';
    });
    const animal = store.animals.find(a => a.id === animalId);
    const receivers = data.households.filter(h => (type === 'move' || h.status === 'Eligible' || type === 'replacement') && h.id !== animal?.holder.id);
    const districtId = animal ? ancestorAt(animal.holder.nodeId, 'district')?.id ?? 'D-NYB' : 'D-NYB';
    const receiver = store.households.find(x => x.id === toId);
    const to: HolderRef | undefined = type === 'return' ? { kind: 'store', id: storeOf(districtId), nodeId: districtId } : receiver ? { kind: 'household', id: receiver.id, nodeId: receiver.villageId } : undefined;
    const input: TransferInput | undefined = animal && to ? { type, animalId: animal.id, from: animal.holder, to, plannedDate: date, reason } : undefined;
    const live = input ? validateTransfer(store, input) : [];
    const create = (submit: boolean) => {
        if (!input) return;
        const r = act((s, u) => { const c = E.createTransfer(s, u, input); return submit && c.ok ? E.submitTransfer(c.s, u, c.id!) : c; });
        if (!r.ok) { setErrors(r.errors); return; }
        onDone(submit ? `Transfer ${r.id} submitted for approval.` : `Transfer ${r.id} saved as Draft.`, r.id);
    };
    const labels = ['Type', 'Animal', 'Parties', 'Review'];
    return <WorkspaceDialog title="New transfer" onClose={onClose} wide>
        <div className="steps" aria-label="Wizard steps">{labels.map((l, i) => <span key={l} className={i === step ? 'on' : ''}>{i + 1}. {l}</span>)}</div>
        {step === 0 && <div className="animal-form">
            <Field label="Transfer type">{<select value={type} onChange={e => { setType(e.target.value as TransferType); setAnimalId(''); setToId(''); }}>{creatable.map(x => <option key={x} value={x}>{t(`type.${x}`)}</option>)}</select>}</Field>
            <p className="registry-demo-note">Approval chain: {(type === 'pass_on' ? ['Cell Officer', 'Sector Officer'] : type === 'return' ? ['District Coordinator'] : ['Sector Officer', 'District Coordinator']).join(' → ')}{type === 'move' ? ' (plus the Provincial Officer for moves between districts)' : ''}. You cannot approve a transfer you created.</p>
            <p className="registry-demo-note">Batch receipt of procured animals from a supplier is recorded when the animal is registered at the district store. Exits (death, loss, cull) have their own evidence workflow.</p>
        </div>}
        {step === 1 && <div className="animal-form">
            <Field label="Animal" required hint={type === 'pass_on' ? 'Only first female calves that reached the pass-on age' : type === 'primary' || type === 'replacement' ? 'Animals in the district store' : 'Animals held by a household'}>
                <select value={animalId} onChange={e => setAnimalId(e.target.value)}><option value="">Choose an animal</option>{candidates.map(a => <option key={a.id} value={a.id}>{a.tag} · {a.breed} · {holderLabel(a.holder, store)}</option>)}</select>
            </Field>
            {!candidates.length && <p className="form-warn">No animal in your jurisdiction can start a {t(`type.${type}`).toLowerCase()} right now.</p>}
        </div>}
        {step === 2 && <div className="animal-form">
            <Field label="Sending holder"><input readOnly value={animal ? holderLabel(animal.holder, store) : ''} /></Field>
            {needsHouseholdReceiver(type) ? <Field label="Receiving household" required hint={type === 'move' ? 'Any registered household' : 'Eligible households (the system checks eligibility, quota and approved lists)'}>
                <select value={toId} onChange={e => setToId(e.target.value)}><option value="">Choose a household</option>{receivers.map(h => <option key={h.id} value={h.id}>{h.headName} · {nodeMap[h.villageId].name} · {h.status}{holdsAny(store, h.id) ? ' · holds an animal' : ''}</option>)}</select>
            </Field> : <Field label="Receiving holder"><input readOnly value="District store" /></Field>}
            <Field label="Planned date" required><input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
            <Field label="Reason" required><textarea value={reason} onChange={e => setReason(e.target.value)} /></Field>
        </div>}
        {step === 3 && input && <div className="animal-form">
            <dl className="kv"><dt>Type</dt><dd>{t(`type.${type}`)}</dd><dt>Animal</dt><dd>{animal?.tag}</dd><dt>From</dt><dd>{holderLabel(input.from, store)}</dd><dt>To</dt><dd>{holderLabel(input.to, store)}</dd><dt>Planned date</dt><dd>{date}</dd><dt>Reason</dt><dd>{reason || '-'}</dd><dt>Created by</dt><dd>{user?.name}</dd></dl>
            {live.length ? <Errors errors={live} /> : <p className="form-ok">All request rules pass.</p>}
        </div>}
        <Errors errors={step < 3 ? errors : []} />
        <div className="dialog-actions">
            <button className="workspace-button" onClick={() => step === 0 ? onClose() : setStep(step - 1)}>{step === 0 ? t('common.cancel') : t('common.back')}</button>
            {step < 3 && <button className="workspace-button green" disabled={(step === 1 && !animalId) || (step === 2 && (!input || !reason.trim()))} onClick={() => { setErrors([]); setStep(step + 1); }}>{t('common.next')}</button>}
            {step === 3 && <><button className="workspace-button" disabled={!!live.length} onClick={() => create(false)}>Save as draft</button><button className="workspace-button green" disabled={!!live.length} onClick={() => create(true)}>Create and submit</button></>}
        </div>
    </WorkspaceDialog>;
}
