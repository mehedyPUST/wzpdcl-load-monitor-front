'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { Eye, Loader2 } from 'lucide-react';

export default function ViewerLogin() {
    const router = useRouter();
    const { user, loginViewer } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'viewer') router.replace('/viewer/dashboard');
    }, [user, router]);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginViewer({ email, password });
            toast.success('Logged in');
            router.replace('/viewer/dashboard');
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-wzpdcl-border">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center mb-3">
                        <Eye className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-wzpdcl-blue">Viewer Login</h1>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border rounded-md px-3 py-2 text-sm" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border rounded-md px-3 py-2 text-sm" />
                    <button type="submit" disabled={loading} className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2.5 rounded-md font-medium flex items-center justify-center gap-2">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />} Sign In
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-slate-500">
                    <Link href="/login" className="hover:underline">← Operator</Link> · <Link href="/admin/login" className="hover:underline">Admin</Link>
                </div>
            </div>
        </div>
    );
}