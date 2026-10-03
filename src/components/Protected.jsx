'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Spinner from '@/components/ui/Spinner';

export default function Protected({ roles = [], children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (roles.length && !roles.includes(user.role)) {
            router.replace('/');
        }
    }, [user, loading, roles, router]);

    if (loading || !user) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-slate-500">
                <Spinner className="w-8 h-8" />
                <span className="text-sm">Loading…</span>
            </div>
        );
    }
    if (roles.length && !roles.includes(user.role)) return null;
    return children;
}
