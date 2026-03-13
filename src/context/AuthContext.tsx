import React, { createContext, useContext, useState } from 'react';
import type { User, Role } from '../types';

interface AuthContextType {
    user: User | null;
    login: (role: Role) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('isonga_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (role: Role) => {
        const mockUser: User = {
            id: '1',
            name: 'Jean de Dieu Habimana',
            email: 'jean.habimana@gov.rw',
            role,
        };
        setUser(mockUser);
        localStorage.setItem('isonga_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('isonga_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
