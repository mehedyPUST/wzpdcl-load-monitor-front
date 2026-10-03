'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { LOGO_URL, APP_NAME } from '@/lib/brand';
import { Loader2, Shield, Eye, Zap } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { user, loginOperator, loginAdmin, loginViewer } = useAuth();

    const [role, setRole] = useState('operator'); // operator | viewer | admin
    const [circles, setCircles] = useState([]);
    const [substations, setSubstations] = useState([]);
    const [circleId, setCircleId] = useState('');
    const [substationId, setSubstationId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in (SBA → input)
    useEffect(() => {
        if (!user) return;
        if (user.role === 'operator') router.replace('/input');
        else if (user.role === 'admin') router.replace('/admin/dashboard');
        else router.replace('/');
    }, [user, router]);

    // Load circles for SBA
    useEffect(() => {
        if (role !== 'operator') return;
        api
            .get('/public/circles')
            .then((res) => setCircles(res.data.circles || []))
            .catch(() => toast.error('Failed to load circles'));
    }, [role]);

    useEffect(() => {
        if (role !== 'operator' || !circleId) {
            setSubstations([]);
            setSubstationId('');
            return;
        }
        api
            .get(`/public/substations?circleId=${circleId}`)
            .then((res) => setSubstations(res.data.substations || []))
            .catch(() => toast.error('Failed to load substations'));
    }, [role, circleId]);

    const afterLogin = (u) => {
        toast.success('Logged in');
        if (u?.role === 'operator') router.replace('/input');
        else if (u?.role === 'admin') router.replace('/admin/dashboard');
        else router.replace('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) return toast.error('Password required');

        setLoading(true);
        try {
            if (role === 'operator') {
                if (!circleId || !substationId) {
                    toast.error('Select circle and substation');
                    return;
                }
                const u = await loginOperator({ circleId, substationId, password });
                afterLogin(u);
            } else if (role === 'admin') {
                if (!email.trim()) return toast.error('Email required');
                const u = await loginAdmin({ email: email.trim(), password });
                afterLogin(u);
            } else {
                if (!email.trim()) return toast.error('Email required');
                const u = await loginViewer({ email: email.trim(), password });
                afterLogin(u);
            }
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center mb-3">
                        <img src={LOGO_URL} alt="WZPDCL" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Sign in</h1>
                    <p className="text-sm text-slate-500 mt-1">{APP_NAME}</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5"
                >
                    {/* Role radio */}
                    <div>
                        <p className="text-xs font-medium text-slate-600 mb-2">
                            I am signing in as
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <RoleCard
                                active={role === 'operator'}
                                onClick={() => setRole('operator')}
                                icon={<Zap className="w-4 h-4" />}
                                label="SBA"
                            />
                            <RoleCard
                                active={role === 'viewer'}
                                onClick={() => setRole('viewer')}
                                icon={<Eye className="w-4 h-4" />}
                                label="Viewer"
                            />
                            <RoleCard
                                active={role === 'admin'}
                                onClick={() => setRole('admin')}
                                icon={<Shield className="w-4 h-4" />}
                                label="Admin"
                            />
                        </div>
                    </div>

                    {/* SBA fields */}
                    {role === 'operator' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Circle
                                </label>
                                <select
                                    value={circleId}
                                    onChange={(e) => {
                                        setCircleId(e.target.value);
                                        setSubstationId('');
                                    }}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Select circle…</option>
                                    {circles.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Grid Substation
                                </label>
                                <select
                                    value={substationId}
                                    onChange={(e) => setSubstationId(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                    disabled={!circleId}
                                >
                                    <option value="">Select substation…</option>
                                    {substations.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Admin / Viewer email */}
                    {(role === 'admin' || role === 'viewer') && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="name@example.com"
                                required
                                autoComplete="username"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        <Link href="/" className="hover:text-blue-700">
                            ← Back to home
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

function RoleCard({ active, onClick, icon, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                active
                    ? 'border-blue-700 bg-blue-50 text-blue-900 ring-2 ring-blue-600/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            <span
                className={
                    active ? 'text-blue-700' : 'text-slate-400'
                }
            >
                {icon}
            </span>
            {label}
            <span
                className={`mt-0.5 w-3 h-3 rounded-full border-2 ${
                    active
                        ? 'border-blue-700 bg-blue-700'
                        : 'border-slate-300 bg-white'
                }`}
            />
        </button>
    );
}
