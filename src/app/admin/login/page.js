'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { LOGO_URL } from '@/lib/brand';
import { Loader2 } from 'lucide-react';

export default function AdminLogin() {
    const router = useRouter();
    const { user, loginAdmin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') router.replace('/admin/dashboard');
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginAdmin({ email, password });
            toast.success('Logged in');
            router.replace('/admin/dashboard');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-wzpdcl-border">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-white rounded-xl border border-wzpdcl-border flex items-center justify-center mb-3 p-1">
                        <img src={LOGO_URL} alt="WZPDCL" className="w-14 h-14 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-wzpdcl-blue">Admin Login</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-wzpdcl-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wzpdcl-blue"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-wzpdcl-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wzpdcl-blue"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-wzpdcl-green text-white py-2.5 rounded-md font-medium hover:bg-green-800 transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    <Link href="/login" className="text-wzpdcl-blue hover:underline">← Operator login</Link>
                    {' · '}
                    <Link href="/viewer/login" className="text-wzpdcl-blue hover:underline">Viewer login</Link>
                </div>
            </div>
        </div>
    );
}