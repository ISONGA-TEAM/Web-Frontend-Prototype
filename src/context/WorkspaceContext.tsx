import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { demoAnimals, demoTransfers } from '../data/workspace';
import type { Animal, CalfTransfer } from '../data/workspace';

interface WorkspaceState {
    animals: Animal[];
    transfers: CalfTransfer[];
    addAnimal: (animal: Animal) => void;
    removeAnimal: (id: string) => void;
    removeTransfer: (id: string) => void;
}
const WorkspaceContext = createContext<WorkspaceState | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [animals, setAnimals] = useState(demoAnimals);
    const [transfers, setTransfers] = useState(demoTransfers);
    return <WorkspaceContext.Provider value={{ animals, transfers,
        addAnimal: animal => setAnimals(previous => [animal, ...previous]),
        removeAnimal: id => setAnimals(previous => previous.filter(animal => animal.id !== id)),
        removeTransfer: id => setTransfers(previous => previous.filter(transfer => transfer.id !== id)),
    }}>{children}</WorkspaceContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('WorkspaceProvider is required');
    return context;
}
