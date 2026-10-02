'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Protected({ roles = [], children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace('/login'); return; }
        if (roles.length && !roles.includes(user.role)) {
            if (user.role === 'admin') router.replace('/admin/dashboard');
            else if (user.role === 'viewer') router.replace('/viewer/dashboard');
            else router.replace('/input');
        }
    }, [user, loading, roles, router]);

    if (loading || !user) {
        return <div className="p-10 text-center text-slate-500">Loading…</div>;
    }
    if (roles.length && !roles.includes(user.role)) return null;
    return children;
}