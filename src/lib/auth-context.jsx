'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load current user on mount
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get('/auth/me');
                if (mounted) setUser(res.data.user);
            } catch {
                if (mounted) setUser(null);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const loginOperator = async ({ circleId, substationId, password }) => {
        const res = await api.post('/auth/operator/login', { circleId, substationId, password });
        setUser(res.data.user);
        return res.data.user;
    };

    const loginViewer = async ({ email, password }) => {
        const res = await api.post('/auth/viewer/login', { email, password });
        setUser(res.data.user);
        return res.data.user;
    };

    const loginAdmin = async ({ email, password }) => {
        const res = await api.post('/auth/admin/login', { email, password });
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, loginOperator, loginViewer, loginAdmin, logout, setUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}