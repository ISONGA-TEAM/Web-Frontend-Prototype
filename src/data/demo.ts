import type { User } from '../types';

// Fictional prototype accounts; not production authentication.
export const demoPassword = 'Isonga2026!';
export const demoAccounts: (User & { username: string })[] = [
    { id: 'demo-district', name: 'Jean Habimana', username: 'district.demo', email: 'district@example.com', role: 'district_officer' },
    { id: 'demo-sector', name: 'Alice Ingabire', username: 'sector.demo', email: 'sector@example.com', role: 'sector_officer' },
    { id: 'demo-agent', name: 'Marie Uwimana', username: 'agent.demo', email: 'agent@example.com', role: 'agenti' },
    { id: 'demo-beneficiary', name: 'Solange Mukamana', username: 'beneficiary.demo', email: 'beneficiary@example.com', role: 'beneficiary' },
    { id: 'demo-admin', name: 'Eric Mugabo', username: 'admin.demo', email: 'admin@example.com', role: 'admin' },
];
export function authenticateDemo(username: string, password: string): User | null {
    const account = demoAccounts.find(account => account.username === username.trim().toLowerCase() || account.email === username.trim().toLowerCase());
    if (!account || password !== demoPassword) return null;
    return { id: account.id, name: account.name, email: account.email, role: account.role };
}
