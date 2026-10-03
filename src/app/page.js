'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { LOGO_URL, APP_NAME, COMPANY_NAME } from '@/lib/brand';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    LogIn,
    Zap,
    BarChart3,
    Shield,
} from 'lucide-react';

function fmt(v) {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
    return Number(v).toFixed(2);
}

export default function Home() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-slate-500">
                Loading…
            </div>
        );
    }

    if (user) return <LoggedInHome user={user} />;
    return <VisitorLanding />;
}

/* ---------- Visitor landing ---------- */
function VisitorLanding() {
    return (
        <div className="w-full">
            {/* Banner */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-sky-700 text-white">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-sky-400 blur-3xl" />
                    <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-emerald-400 blur-3xl" />
                </div>
                <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs mb-4">
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            West Zone Power Distribution Company Limited
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                            {APP_NAME}
                        </h1>
                        <p className="text-sky-100 text-base md:text-lg max-w-xl mb-8">
                            Real-time hourly load monitoring across all circles and grid
                            substations — collect, track progress, and report load, allotment
                            and loadshed data.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-sky-50 transition shadow-lg"
                            >
                                <LogIn className="w-5 h-5" />
                                Sign in
                            </Link>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <div className="w-36 h-36 md:w-44 md:h-44 bg-white rounded-2xl shadow-2xl flex items-center justify-center p-4">
                            <img
                                src={LOGO_URL}
                                alt="WZPDCL"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-4 py-14">
                <h2 className="text-center text-2xl font-bold text-slate-800 mb-8">
                    System features
                </h2>
                <div className="grid md:grid-cols-3 gap-5">
                    <Feature
                        icon={<Activity className="w-6 h-6 text-blue-700" />}
                        title="Hourly input"
                        text="SBA operators submit Actual Load, PGCB Allotment, Loadshed and PBS data for every time slot."
                    />
                    <Feature
                        icon={<BarChart3 className="w-6 h-6 text-emerald-700" />}
                        title="Live monitoring"
                        text="Admins track submission progress by circle and substation for the current hour in real time."
                    />
                    <Feature
                        icon={<Shield className="w-6 h-6 text-slate-700" />}
                        title="Role-based access"
                        text="Separate access for SBA, Viewer and Admin with secure login and audit-friendly records."
                    />
                </div>
            </section>

            {/* CTA */}
            <section className="bg-slate-50 border-t border-slate-200">
                <div className="max-w-6xl mx-auto px-4 py-10 text-center">
                    <p className="text-slate-600 mb-4">
                        Authorized personnel only. Please sign in with your assigned role.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-900"
                    >
                        <LogIn className="w-4 h-4" /> Go to login
                    </Link>
                    <p className="text-xs text-slate-400 mt-6">{COMPANY_NAME}</p>
                </div>
            </section>
        </div>
    );
}

function Feature({ icon, title, text }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
                {icon}
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
        </div>
    );
}

/* ---------- Logged-in overview ---------- */
function LoggedInHome({ user }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await api.get('/load/current-status');
                if (alive) setData(res.data);
            } catch (e) {
                if (alive) setError(e.message || 'Failed to load overview');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        const t = setInterval(async () => {
            try {
                const res = await api.get('/load/current-status');
                if (alive) setData(res.data);
            } catch {
                /* ignore refresh errors */
            }
        }, 30000);
        return () => {
            alive = false;
            clearInterval(t);
        };
    }, []);

    const totals = data?.totals || {};
    const pct =
        totals.totalSubstations > 0
            ? Math.round((totals.submitted / totals.totalSubstations) * 100)
            : 0;

    const dashHref =
        user.role === 'admin'
            ? '/admin/dashboard'
            : user.role === 'viewer'
              ? '/viewer/dashboard'
              : '/input';

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Welcome{user.name ? `, ${user.name}` : ''}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        System overview · current hour
                        {user.role === 'operator' && user.substationName
                            ? ` · ${user.substationName}`
                            : ''}
                        {user.role === 'operator' && user.circleName
                            ? ` (${user.circleName})`
                            : ''}
                    </p>
                </div>
                <Link
                    href={dashHref}
                    className="inline-flex items-center gap-2 bg-blue-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-900"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    {user.role === 'admin'
                        ? 'Open monitor'
                        : user.role === 'operator'
                          ? 'Hourly input'
                          : 'Dashboard'}
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                    {error}
                </div>
            )}

            {loading && !data && (
                <p className="text-center text-slate-500 py-12">Loading overview…</p>
            )}

            {data && (
                <>
                    {/* Slot bar */}
                    <div className="bg-slate-800 text-white rounded-xl px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-80" />
                            <span>
                                Current slot:{' '}
                                <strong className="text-base">{data.label || '—'}</strong>
                            </span>
                            {data.isLive && (
                                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                                    LIVE
                                </span>
                            )}
                        </div>
                        <span className="text-slate-300 text-xs">
                            {data.date} · auto-refresh 30s
                        </span>
                    </div>

                    {/* KPI */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        <Kpi
                            title="Total Actual Load"
                            value={`${fmt(totals.actualLoad)} MW`}
                            color="bg-sky-600"
                            icon={<Zap className="w-5 h-5" />}
                        />
                        <Kpi
                            title="Total Allotment"
                            value={`${fmt(totals.pgcbAllotment)} MW`}
                            color="bg-emerald-600"
                            icon={<BarChart3 className="w-5 h-5" />}
                        />
                        <Kpi
                            title="Total Loadshed"
                            value={`${fmt(totals.loadshed)} MW`}
                            color="bg-red-600"
                            icon={<AlertTriangle className="w-5 h-5" />}
                        />
                        <Kpi
                            title="Input progress"
                            value={`${totals.submitted || 0}/${totals.totalSubstations || 0}`}
                            sub={`${pct}% substations`}
                            color="bg-amber-600"
                            icon={<CheckCircle2 className="w-5 h-5" />}
                        />
                    </div>

                    {/* Progress */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">
                                Hourly submission progress
                            </span>
                            <span className="text-slate-500">{pct}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={`h-full ${
                                    pct === 100
                                        ? 'bg-emerald-500'
                                        : pct >= 50
                                          ? 'bg-amber-500'
                                          : 'bg-red-500'
                                }`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Per-circle summary */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b bg-slate-50 font-semibold text-slate-800 text-sm">
                            Circle-wise totals (this hour)
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-600 text-xs">
                                    <tr>
                                        <th className="text-left px-4 py-2">Circle</th>
                                        <th className="text-center px-3 py-2">Progress</th>
                                        <th className="text-right px-3 py-2">Actual (MW)</th>
                                        <th className="text-right px-3 py-2">Allotment (MW)</th>
                                        <th className="text-right px-3 py-2">Loadshed (MW)</th>
                                        <th className="text-right px-3 py-2">PBS (MW)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.circles || []).map((c) => (
                                        <tr key={c.circleId} className="border-t">
                                            <td className="px-4 py-2 font-medium">
                                                {c.circleName}
                                            </td>
                                            <td className="px-3 py-2 text-center text-xs">
                                                <span
                                                    className={
                                                        c.pending === 0
                                                            ? 'text-emerald-700'
                                                            : 'text-amber-700'
                                                    }
                                                >
                                                    {c.submitted}/{c.totalSubstations}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(c.totals?.actualLoad)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(c.totals?.pgcbAllotment)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(c.totals?.loadshed)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(c.totals?.pbsLoad)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(data.circles || []).length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center py-8 text-slate-500"
                                            >
                                                No circles configured yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {(data.circles || []).length > 0 && (
                                    <tfoot>
                                        <tr className="bg-slate-50 border-t-2 font-semibold">
                                            <td className="px-4 py-2">WZPDCL total</td>
                                            <td className="px-3 py-2 text-center text-xs font-normal">
                                                {totals.submitted}/{totals.totalSubstations}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(totals.actualLoad)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(totals.pgcbAllotment)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(totals.loadshed)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {fmt(totals.pbsLoad)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function Kpi({ title, value, sub, color, icon }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className={`h-1 ${color}`} />
            <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                        {title}
                    </span>
                    <span className="text-slate-400">{icon}</span>
                </div>
                <div className="text-xl font-bold text-slate-800 tabular-nums">{value}</div>
                {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}
