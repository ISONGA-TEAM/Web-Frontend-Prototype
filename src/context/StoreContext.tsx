import { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { buildSeed } from '../data/seed';
import { visible } from '../lib/scope';
import type { Visible } from '../lib/scope';
import { setCurrentGrants } from '../lib/rules';
import type { Result } from '../lib/engine';
import type { Store, User } from '../types';
import { useAuth } from './AuthContext';

interface StoreCtx {
    store: Store;
    /** Jurisdiction-filtered data for the signed-in user. */
    data: Visible;
    asOf: number;
    act: (fn: (s: Store, user: User) => Result) => Result;
    refresh: () => void;
    reset: () => void;
}
const Ctx = createContext<StoreCtx | null>(null);
const emptyData: Visible = { households: [], transfers: [], animals: [], exits: [], lists: [], visits: [], healthEvents: [], calvings: [], grievances: [] };

/** Lives above the router so granted permissions and demo records survive signing out and back in as another user. */
export function StoreProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [store, setStore] = useState(() => buildSeed());
    const ref = useRef(store);
    const [asOf, setAsOf] = useState(Date.now());
    const value = useMemo<StoreCtx>(() => {
        setCurrentGrants(store.grants);
        return {
            store,
            data: user ? visible(store, user) : emptyData,
            asOf,
            act: fn => { const r = fn(ref.current, user!); ref.current = r.s; setStore(r.s); setAsOf(Date.now()); return r; },
            refresh: () => setAsOf(Date.now()),
            reset: () => { const s = buildSeed(); ref.current = s; setStore(s); setAsOf(Date.now()); },
        };
    }, [store, user, asOf]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
    const c = useContext(Ctx);
    if (!c) throw new Error('StoreProvider is required');
    return c;
}
