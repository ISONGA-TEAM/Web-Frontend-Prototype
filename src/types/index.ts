import type { Grants } from '../lib/rules';
// Domain types for Isonga Girinka (SRS v2.0).
export type Role =
    | 'system_admin' | 'national_officer' | 'provincial_officer' | 'district_coordinator'
    | 'sector_officer' | 'cell_officer' | 'village_agent' | 'household' | 'auditor';

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    role: Role;
    /** Jurisdiction node (REQ-04: exactly one role, one node). Households use their village. */
    nodeId: string;
    householdId?: string;
}

export type HolderKind = 'supplier' | 'store' | 'household' | 'exit';
export interface HolderRef { kind: HolderKind; id: string; nodeId: string }

export type EligibilityStatus = 'Registered' | 'Eligible' | 'Not Eligible' | 'Needs Review';
export interface Assessment {
    id: string; date: string; assessorId: string; result: EligibilityStatus;
    criteria: { key: string; answer: boolean; evidence: 'document' | 'visit' | 'witness' | 'none' }[];
}
export interface Household {
    id: string; headName: string; nid: string; verification: 'manual' | 'lookup'; sex: 'F' | 'M';
    dob: string; size: number; villageId: string; phone: string; shelter: string;
    vulnerability: string[]; status: EligibilityStatus; registeredOn: string;
    assessments: Assessment[]; consentOn: string;
}

export type AnimalStatus =
    | 'In District Store' | 'Allocated (In Transit)' | 'With Holder' | 'Pregnant' | 'Lactating'
    | 'Deceased' | 'Lost' | 'Culled' | 'Closed Chain';
export interface LedgerEntry { seq: number; kind: 'registration' | 'transfer' | 'exit' | 'reversal'; ref: string; from: string; to: string; ts: string; prevHash: string; hash: string }
export interface Animal {
    id: string; tag: string; breed: string; sex: 'Female' | 'Male'; dob: string; dobEstimated: boolean;
    colour: string; source: string; damId?: string; status: AnimalStatus; holder: HolderRef;
    statusHistory: { ts: string; status: AnimalStatus; ref: string }[];
    ledger: LedgerEntry[]; pregnancyCheck?: string; closedOn?: string;
}

export type TransferType = 'primary' | 'pass_on' | 'replacement' | 'move' | 'return' | 'reversal';
export type TransferState =
    | 'Draft' | 'Submitted' | 'Pending Next Approval' | 'Approved' | 'Dispatched'
    | 'Received' | 'Completed' | 'Returned' | 'Rejected' | 'Disputed' | 'Cancelled';
export interface Approval { level: number; role: Role; approverId: string; decision: 'approve' | 'return' | 'reject'; comment: string; ts: string }
export interface Transfer {
    id: string; type: TransferType; animalId: string; from: HolderRef; to: HolderRef; state: TransferState;
    createdBy: string; createdAt: string; plannedDate: string; reason: string;
    approvals: Approval[]; history: { ts: string; by: string; state: TransferState; note: string }[];
    dispatch?: { ts: string; sender: string; senderNid: string; transport: string; photos: string[]; gps: string };
    receipt?: { ts: string; by: string; tagRead: string; sex: string; condition: 'good' | 'fair' | 'poor'; remarks: string };
    ack?: { ts: string; method: 'otp' | 'paper'; device: string };
    reversalOf?: string; completedAt?: string; chain: Role[]; prevStatus?: AnimalStatus;
}

export interface ExitEvent {
    id: string; animalId: string; date: string; category: 'death' | 'loss' | 'cull'; cause: string;
    evidence: 'vet_certificate' | 'photo' | 'witness_statement' | 'cell_report'; reportedBy: string;
    state: 'Verified' | 'Pending Verification' | 'Rejected'; verifiedBy?: string; reversalOf?: string; recordedAt: string; holderId: string; nodeId: string;
}

export interface SelectionList {
    id: string; nodeId: string; type: 'beneficiary' | 'pass_on'; version: number; householdIds: string[];
    step: 'Village nomination' | 'Cell verification' | 'Sector approval' | 'District approval' | 'Approved';
    log: { ts: string; by: string; step: string; action: 'advance' | 'return'; comment: string }[]; locked: boolean;
}

export interface HealthEvent { id: string; animalId: string; type: 'vaccination' | 'deworming' | 'treatment' | 'vet_visit' | 'body_condition' | 'pregnancy_check'; date: string; product: string; dose: string; score?: number; officerId: string; remarks: string }
export interface Visit { id: string; householdId: string; date: string; officerId: string; shelter: 'good' | 'fair' | 'poor'; animal: 'good' | 'fair' | 'poor'; feedWater: 'good' | 'fair' | 'poor'; issues: string }
export interface Calving { id: string; damId: string; date: string; calfIds: string[]; complications: string; recordedBy: string }
export interface Grievance { id: string; householdId: string; category: 'eligibility' | 'transfer' | 'receipt' | 'animal_care'; text: string; raisedOn: string; routedToRole: Role; status: 'Open' | 'Acknowledged' | 'Closed'; outcome?: string; nodeId: string; closedOn?: string }
export interface AuditEntry { id: string; ts: string; userId: string; role: Role; nodeId: string; action: string; recordId: string; result: 'ok' | 'denied'; detail: string }
export interface Target { nodeId: string; year: number; animals: number; households: number; version: number }
export interface AlertState { status: 'New' | 'Acknowledged' | 'Resolved'; note: string; by: string; ts: string }

/** A named dashboard view: filters plus the map layer. Private by default; may be shared with users in the same or a lower jurisdiction (REQ-37). */
export interface SavedView { id: string; ownerId: string; ownerNodeId: string; name: string; query: string; layer: string; shared: boolean; createdAt: string }

export interface Config {
    passOnAgeMonths: number; replacementWindowMonths: number; receiptHours: number; passOnAmberDays: number; passOnRedDays: number;
    exitVerifyDays: number; approvalBacklog: number; visitCoveragePct: number; visitIntervalDays: number; vaccineIntervalDays: number;
}

export interface Store {
    users: User[]; households: Household[]; animals: Animal[]; transfers: Transfer[]; exits: ExitEvent[]; lists: SelectionList[];
    healthEvents: HealthEvent[]; visits: Visit[]; calvings: Calving[]; grievances: Grievance[]; audit: AuditEntry[];
    alertStates: Record<string, AlertState>; targets: Target[]; config: Config; seq: number; grants: Grants; savedViews: SavedView[];
}
