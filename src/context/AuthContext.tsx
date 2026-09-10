import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';
import { authenticateDemo } from '../data/demo';

interface AuthContextType {
    user: User | null;
    logout: () => void;
    signIn: (username: string, password: string) => boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Start each app load at sign-in; old saved demo sessions must not bypass it.
    const [user, setUser] = useState<User | null>(null);

    const signIn = (username: string, password: string) => {
        const account = authenticateDemo(username, password);
        if (!account) return false;
        setUser(account);
        return true;
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signIn, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
