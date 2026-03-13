export type Role = 'beneficiary' | 'agenti' | 'sector_officer' | 'district_officer' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface Household {
    id: string;
    headName: string;
    nid: string;
    ubudehe: 1 | 2 | 3 | 4;
    location: {
        district: string;
        sector: string;
        cell: string;
        village: string;
    };
    programs: {
        girinka: { status: 'enrolled' | 'pending' | 'not_eligible'; date?: string };
        vup: { status: 'enrolled' | 'pending' | 'not_eligible'; date?: string };
        ejo_heza: { status: 'active' | 'pending' | 'not_eligible'; date?: string };
    };
    graduationStatus: 'registered' | 'assigned' | 'enrolled' | 'active' | 'graduated';
    lastUpdated: string;
}

export interface LivestockEvent {
    id: string;
    householdId: string;
    animalId: string;
    type: 'vaccination' | 'illness' | 'recovery' | 'mortality' | 'calving';
    date: string;
    description: string;
    loggedBy: string;
    status: 'pending' | 'resolved';
}

export interface Message {
    id: string;
    senderId: string;
    category: 'query' | 'complaint' | 'asset_issue' | 'general';
    text: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
}
