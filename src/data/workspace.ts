import { demoHouseholds } from './households';

export const speciesOptions = ['Cattle', 'Goats', 'Poultry', 'Sheep'] as const;
export type Species = typeof speciesOptions[number];
export type AnimalStatus = 'Active' | 'Under care' | 'Transferred';
export type TransferStatus = 'Approved' | 'Rejected' | 'Pending';
export interface Animal {
    id: string;
    householdId: string;
    name: string;
    email: string;
    sector: string;
    species: Species;
    breed: string;
    status: AnimalStatus;
    date: string;
}
export interface CalfTransfer {
    id: string;
    animalId: string;
    from: string;
    to: string;
    species: string;
    breed: string;
    status: TransferStatus;
    date: string;
}
export const demoAnimals: Animal[] = Array.from({ length: 132 }, (_, i) => {
    const household = demoHouseholds[i % demoHouseholds.length];
    const species: Species = i < 108 ? 'Cattle' : i < 114 ? 'Goats' : i < 120 ? 'Poultry' : 'Sheep';
    return {
        id: `LV-${String(i + 1).padStart(4, '0')}`,
        householdId: household.id,
        name: household.headName,
        email: `household${i % demoHouseholds.length + 1}@example.com`,
        sector: household.location.sector,
        species,
        breed: species === 'Cattle' ? (i % 3 === 0 ? 'Inyambo' : 'Friesian cross') : species === 'Goats' ? 'Boer cross' : species === 'Poultry' ? 'Sasso' : 'Local sheep',
        status: i % 17 === 0 ? 'Under care' : 'Active',
        date: `2026-09-${String(9 - i % 9).padStart(2, '0')}`,
    };
});
export const demoTransfers: CalfTransfer[] = Array.from({ length: 24 }, (_, i) => ({
    id: `CT-${String(i + 1).padStart(4, '0')}`,
    animalId: demoAnimals[i].id,
    from: demoAnimals[i].name,
    to: demoHouseholds[(i + 3) % demoHouseholds.length].headName,
    species: 'Cattle',
    breed: demoAnimals[i].breed,
    status: i % 7 === 3 ? 'Rejected' : i % 5 === 1 ? 'Pending' : 'Approved',
    date: `2026-09-${String(9 - i % 9).padStart(2, '0')}`,
}));
export const demoAlerts = [
    { id: 'AL-01', name: 'HABIMANA Jean', text: 'Livestock health review required', date: '2026-09-09', type: 'Health', path: '/livestock' },
    { id: 'AL-02', name: 'MUKAMANA Solange', text: 'Calf transfer awaiting approval', date: '2026-09-09', type: 'Transfer', path: '/transfers' },
    { id: 'AL-03', name: 'INGABIRE Alice', text: 'New household enrolled in Girinka', date: '2026-09-08', type: 'Program', path: '/households/HH-1005' },
    { id: 'AL-04', name: 'UWIMANA Marie', text: 'Follow-up visit scheduled', date: '2026-09-08', type: 'Visit', path: '/households/HH-1003' },
    { id: 'AL-05', name: 'MUGABO David', text: 'Livestock vaccination due', date: '2026-09-07', type: 'Health', path: '/livestock' },
];
export function formatDemoDate(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB');
}
export function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
