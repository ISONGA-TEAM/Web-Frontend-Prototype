import type { Household } from '../types';

// Mock data generator
export const generateMockHouseholds = (count: number): Household[] => {
    const names = ['HABIMANA Jean', 'MUKAMANA Solange', 'NTAKIRUTIMANA Eric', 'UWIMANA Marie', 'GAKWAYA Silas', 'INGABIRE Alice', 'MUGABO David', 'NYIRAHABIMANA Beatrice', 'MUTANGUHA Paul', 'KAMANZI Alex'];
    const sectors = ['Bigogwe', 'Jenda', 'Jomba', 'Kabatwa', 'Karago', 'Kintobo', 'Mukamira', 'Rambura', 'Rurembo', 'Rugera'];
    const sectorDistribution = [0, 1, 3, 5, 6, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 3, 5, 6, 9, 0, 1, 2, 3, 4, 7, 8, 0];
    const status: Household['graduationStatus'][] = ['registered', 'assigned', 'enrolled', 'active', 'graduated'];

    return Array.from({ length: count }, (_, i) => ({
        id: `HH-${1000 + i}`,
        headName: names[i % names.length],
        nid: `11985800${1234567 + i}`,
        ubudehe: (i % 4 + 1) as Household['ubudehe'],
        location: {
            district: 'Nyabihu',
            sector: sectors[sectorDistribution[i % sectorDistribution.length]],
            cell: 'Gasiza',
            village: 'Kovu'
        },
        programs: {
            girinka: { status: i % 3 === 0 ? 'enrolled' : 'not_eligible', date: i % 3 === 0 ? '2023-05-12' : undefined },
            vup: { status: i % 2 === 0 ? 'enrolled' : 'pending', date: i % 2 === 0 ? '2023-08-20' : undefined },
            ejo_heza: { status: i % 4 === 0 ? 'active' : 'pending', date: i % 4 === 0 ? '2024-01-15' : undefined },
        },
        graduationStatus: status[i % 5],
        lastUpdated: '2026-09-01T09:00:00.000Z'
    }));
};

export const demoHouseholds = generateMockHouseholds(30);
