import React, { createContext, useContext, useRef, useState } from 'react';
import type { User } from '../types';
import { buildUsers, demoPassword } from '../data/seed';

export const demoUsers = buildUsers();
/** Demo second factor (REQ-05). The real system sends a one-time code by SMS or authenticator app. */
export const demoOtp = '246810';
export type SignInResult = 'ok' | 'otp' | 'bad' | 'locked';

interface AuthContextType {
    user: User | null;
    pending: User | null;
    signIn: (username: string, password: string) => SignInResult;
    verifyOtp: (code: string) => boolean;
    cancelOtp: () => void;
    logout: () => void;
    isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCK_MS = 30 * 60_000; const WINDOW_MS = 15 * 60_000;

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: User }> = ({ children, initialUser }) => {
    // Each load starts at sign-in; demo sessions are never restored (initialUser is for tests).
    const [user, setUser] = useState<User | null>(initialUser ?? null);
    const [pending, setPending] = useState<User | null>(null);
    const failures = useRef<Record<string, number[]>>({});
    const locked = useRef<Record<string, number>>({});

    const signIn = (username: string, password: string): SignInResult => {
        const key = username.trim().toLowerCase();
        const now = Date.now();
        if ((locked.current[key] ?? 0) > now) return 'locked';
        const account = demoUsers.find(u => u.username === key || u.email === key);
        if (!account || password !== demoPassword) {
            const recent = [...(failures.current[key] ?? []).filter(t => now - t < WINDOW_MS), now];
            failures.current[key] = recent;
            if (recent.length >= 5) { locked.current[key] = now + LOCK_MS; failures.current[key] = []; return 'locked'; }
            return 'bad';
        }
        failures.current[key] = [];
        if (account.role !== 'village_agent' && account.role !== 'household') { setPending(account); return 'otp'; }
        setUser(account);
        return 'ok';
    };
    const verifyOtp = (code: string) => {
        if (!pending || code.trim() !== demoOtp) return false;
        setUser(pending); setPending(null);
        return true;
    };
    return <AuthContext.Provider value={{ user, pending, signIn, verifyOtp, cancelOtp: () => setPending(null), logout: () => { setUser(null); setPending(null); }, isAuthenticated: !!user }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
