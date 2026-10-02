'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { LOGO_URL } from '@/lib/brand';
import { Loader2 } from 'lucide-react';

export default function OperatorLogin() {
    const router = useRouter();
    const { user, loginOperator } = useAuth();

    const [circles, setCircles] = useState([]);
    const [substations, setSubstations] = useState([]);
    const [circleId, setCircleId] = useState('');
    const [substationId, setSubstationId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Load circles on mount
    useEffect(() => {
        api.get('/public/circles')
            .then((res) => setCircles(res.data.circles || []))
            .catch(() => toast.error('Failed to load circles'));
    }, []);

    // Load substations when circle changes
    useEffect(() => {
        if (!circleId) { setSubstations([]); setSubstationId(''); return; }
        api.get(`/public/substations?circleId=${circleId}`)
            .then((res) => setSubstations(res.data.substations || []))
            .catch(() => toast.error('Failed to load substations'));
    }, [circleId]);

    // Redirect if already logged in
    useEffect(() => {
        if (!user) return;
        if (user.role === 'operator') router.replace('/input');
        else if (user.role === 'admin') router.replace('/admin/dashboard');
        else if (user.role === 'viewer') router.replace('/viewer/dashboard');
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!circleId || !substationId || !password) {
            toast.error('All fields are required');
            return;
        }
        setLoading(true);
        try {
            await loginOperator({ circleId, substationId, password });
            toast.success('Logged in');
            router.replace('/input');
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
                    <h1 className="text-2xl font-bold text-wzpdcl-blue">Operator Login</h1>
                    <p className="text-sm text-slate-500 mt-1">Select your circle and grid substation</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Circle</label>
                        <select
                            value={circleId}
                            onChange={(e) => setCircleId(e.target.value)}
                            className="w-full border border-wzpdcl-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wzpdcl-blue"
                            required
                        >
                            <option value="">— Select Circle —</option>
                            {circles.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Grid Substation</label>
                        <select
                            value={substationId}
                            onChange={(e) => setSubstationId(e.target.value)}
                            disabled={!circleId}
                            className="w-full border border-wzpdcl-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wzpdcl-blue disabled:bg-slate-100"
                            required
                        >
                            <option value="">— Select Substation —</option>
                            {substations.map((s) => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
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
                        className="w-full bg-wzpdcl-blue text-white py-2.5 rounded-md font-medium hover:bg-blue-900 transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Admin? <Link href="/admin/login" className="text-wzpdcl-blue hover:underline">Admin login</Link>
                    {' · '}
                    Viewer? <Link href="/viewer/login" className="text-wzpdcl-blue hover:underline">Viewer login</Link>
                </div>
            </div>
        </div>
    );
}