'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api, { setStoredToken, clearStoredToken, getStoredToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // If we have a stored token, /auth/me will succeed even without cookie
                if (!getStoredToken()) {
                    // still try cookie-based session
                }
                const res = await api.get('/auth/me');
                if (mounted) setUser(res.data.user);
            } catch {
                if (mounted) {
                    setUser(null);
                    clearStoredToken();
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const persist = (data) => {
        if (data?.token) setStoredToken(data.token);
        if (data?.user) setUser(data.user);
        return data?.user;
    };

    const loginOperator = async ({ circleId, substationId, password }) => {
        const res = await api.post('/auth/operator/login', {
            circleId,
            substationId,
            password,
        });
        return persist(res.data);
    };

    const loginViewer = async ({ email, password }) => {
        const res = await api.post('/auth/viewer/login', { email, password });
        return persist(res.data);
    };

    const loginAdmin = async ({ email, password }) => {
        const res = await api.post('/auth/admin/login', { email, password });
        return persist(res.data);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            /* ignore */
        }
        clearStoredToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                loginOperator,
                loginViewer,
                loginAdmin,
                logout,
                setUser,
            }}
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
