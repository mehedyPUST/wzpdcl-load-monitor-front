'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import { useAuth } from '@/lib/auth-context';
import Spinner from '@/components/ui/Spinner';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Download, Printer, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

function todayDhaka() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

function fmt(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '—';
}

export default function Reports() {
    return (
        <Protected roles={['admin', 'viewer', 'operator']}>
            <ReportsInner />
        </Protected>
    );
}

function ReportsInner() {
    const { user } = useAuth();
    const isOperator = user?.role === 'operator';

    const [circles, setCircles] = useState([]);
    const [subs, setSubs] = useState([]);
    const [scope, setScope] = useState(isOperator ? 'circle' : 'all');
    const [circleId, setCircleId] = useState('');
    const [ssId, setSsId] = useState('');
    const [period, setPeriod] = useState('daily');
    const [date, setDate] = useState(todayDhaka());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chartType, setChartType] = useState('line'); // line | area | bar

    useEffect(() => {
        if (isOperator) {
            setScope('circle');
            setCircleId(user.circleId || '');
        } else {
            api.get('/public/circles')
                .then((r) => setCircles(r.data.circles || []))
                .catch(() => {});
        }
    }, [user, isOperator]);

    // Load substations when circle selected (for SS scope)
    useEffect(() => {
        const cid = isOperator ? user?.circleId : circleId;
        if (!cid || scope !== 'substation') {
            setSubs([]);
            return;
        }
        api
            .get(`/public/substations?circleId=${cid}`)
            .then((r) => setSubs(r.data.substations || []))
            .catch(() => setSubs([]));
    }, [scope, circleId, isOperator, user]);

    const selectedId = useMemo(() => {
        if (scope === 'all') return 'all';
        if (scope === 'circle') return isOperator ? user?.circleId : circleId;
        return ssId;
    }, [scope, circleId, ssId, isOperator, user]);

    const load = async () => {
        if (scope !== 'all' && !selectedId) {
            return toast.error('Select circle or substation');
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({
                scope,
                period,
                date,
            });
            if (scope !== 'all') params.set('id', selectedId);
            const r = await api.get(`/load/reports?${params.toString()}`);
            setData(r.data);
        } catch (e) {
            toast.error(e.message || 'Failed to load report');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // auto-load when operator has circle
        if (isOperator && user?.circleId) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOperator, user?.circleId, period, date]);

    const downloadCsv = () => {
        if (!data?.series?.length) return;
        const header =
            'Label,Actual_Load_MW,Allotment_MW,Loadshed_MW,Demand_MW,PBS_Load_MW\n';
        const body = data.series
            .map(
                (s) =>
                    `${s.label},${s.actualLoad},${s.pgcbAllotment},${s.loadshed},${s.demand},${s.pbsLoad}`
            )
            .join('\n');
        const blob = new Blob(['\uFEFF' + header + body], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${(data.label || 'data').replace(/\s+/g, '_')}-${period}-${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totals = data?.totals || {};
    const series = data?.series || [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <BarChart3 className="w-5 h-5" />
                        </span>
                        Charts &amp; reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Actual load · Allotment · Loadshed · Demand (Actual + Loadshed)
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="no-print card p-4 flex flex-wrap items-end gap-3">
                {!isOperator && (
                    <div>
                        <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                            Scope
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => {
                                setScope(e.target.value);
                                setData(null);
                            }}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                        >
                            <option value="all">All circles</option>
                            <option value="circle">Circle-wise</option>
                            <option value="substation">Grid SS-wise</option>
                        </select>
                    </div>
                )}

                {(scope === 'circle' || scope === 'substation') && !isOperator && (
                    <div>
                        <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                            Circle
                        </label>
                        <select
                            value={circleId}
                            onChange={(e) => {
                                setCircleId(e.target.value);
                                setSsId('');
                            }}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white min-w-[150px]"
                        >
                            <option value="">Select…</option>
                            {circles.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {isOperator && (
                    <div>
                        <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                            Scope
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                        >
                            <option value="circle">My circle</option>
                            <option value="substation">My / other SS</option>
                        </select>
                    </div>
                )}

                {scope === 'substation' && (
                    <div>
                        <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                            Grid SS
                        </label>
                        <select
                            value={ssId}
                            onChange={(e) => setSsId(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white min-w-[160px]"
                        >
                            <option value="">Select…</option>
                            {isOperator && user?.substationId && (
                                <option value={user.substationId}>
                                    {user.substationName || 'My SS'}
                                </option>
                            )}
                            {subs
                                .filter((s) => s._id !== user?.substationId)
                                .map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                        Period
                    </label>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    >
                        <option value="daily">Day (hourly)</option>
                        <option value="weekly">Week (daily)</option>
                        <option value="monthly">Month (daily)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                        Anchor date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    />
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                        Chart
                    </label>
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    >
                        <option value="line">Line</option>
                        <option value="area">Area</option>
                        <option value="bar">Bar</option>
                    </select>
                </div>

                <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl"
                >
                    {loading ? <Spinner className="w-4 h-4 text-white" /> : null}
                    Load chart
                </button>

                {data && (
                    <>
                        <button
                            onClick={downloadCsv}
                            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 text-sm px-3 py-2 rounded-xl hover:bg-slate-50"
                        >
                            <Download className="w-4 h-4" /> CSV
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 text-sm px-3 py-2 rounded-xl hover:bg-slate-50"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </>
                )}
            </div>

            {/* KPI totals */}
            {loading && !data && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {data && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Kpi label="Actual Load" value={`${fmt(totals.actualLoad)} MW`} tone="sky" />
                        <Kpi label="Allotment" value={`${fmt(totals.pgcbAllotment)} MW`} tone="teal" />
                        <Kpi label="Loadshed" value={`${fmt(totals.loadshed)} MW`} tone="rose" />
                        <Kpi
                            label="Demand"
                            value={`${fmt(totals.demand)} MW`}
                            sub="Actual + Loadshed"
                            tone="violet"
                        />
                    </div>

                    <div className="card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <h2 className="font-semibold text-slate-800">
                                {data.label}{' '}
                                <span className="text-slate-400 font-normal text-sm">
                                    · {data.period} · {data.from}
                                    {data.from !== data.to ? ` → ${data.to}` : ''}
                                </span>
                            </h2>
                            <span className="text-xs text-slate-400">
                                {series.length} point(s)
                            </span>
                        </div>

                        {series.length === 0 ? (
                            <p className="text-center text-slate-500 py-16">
                                No data for this range
                            </p>
                        ) : (
                            <div className="w-full h-[380px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'bar' ? (
                                        <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="actualLoad" name="Actual Load" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="pgcbAllotment" name="Allotment" fill="#0d9488" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="loadshed" name="Loadshed" fill="#e11d48" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="demand" name="Demand" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : chartType === 'area' ? (
                                        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Area type="monotone" dataKey="demand" name="Demand" stroke="#7c3aed" fill="#7c3aed33" />
                                            <Area type="monotone" dataKey="actualLoad" name="Actual Load" stroke="#0284c7" fill="#0284c733" />
                                            <Area type="monotone" dataKey="pgcbAllotment" name="Allotment" stroke="#0d9488" fill="#0d948833" />
                                            <Area type="monotone" dataKey="loadshed" name="Loadshed" stroke="#e11d48" fill="#e11d4833" />
                                        </AreaChart>
                                    ) : (
                                        <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="actualLoad" name="Actual Load" stroke="#0284c7" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="pgcbAllotment" name="Allotment" stroke="#0d9488" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="loadshed" name="Loadshed" stroke="#e11d48" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="demand" name="Demand" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Data table */}
                    {series.length > 0 && (
                        <div className="card overflow-x-auto">
                            <table className="table-modern">
                                <thead>
                                    <tr>
                                        <th className="text-center w-12">SN</th>
                                        <th className="text-left">
                                            {period === 'daily' ? 'Hour' : 'Date'}
                                        </th>
                                        <th className="text-right">Actual (MW)</th>
                                        <th className="text-right">Allotment (MW)</th>
                                        <th className="text-right">Loadshed (MW)</th>
                                        <th className="text-right">Demand (MW)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {series.map((s, i) => (
                                        <tr key={s.key}>
                                            <td className="text-center text-slate-500">{i + 1}</td>
                                            <td className="font-medium">{s.label}</td>
                                            <td className="text-right tabular-nums">{fmt(s.actualLoad)}</td>
                                            <td className="text-right tabular-nums">{fmt(s.pgcbAllotment)}</td>
                                            <td className="text-right tabular-nums">{fmt(s.loadshed)}</td>
                                            <td className="text-right tabular-nums font-medium">{fmt(s.demand)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td />
                                        <td>Total</td>
                                        <td className="text-right tabular-nums">{fmt(totals.actualLoad)}</td>
                                        <td className="text-right tabular-nums">{fmt(totals.pgcbAllotment)}</td>
                                        <td className="text-right tabular-nums">{fmt(totals.loadshed)}</td>
                                        <td className="text-right tabular-nums">{fmt(totals.demand)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function Kpi({ label, value, sub, tone }) {
    const tones = {
        sky: 'from-sky-500 to-blue-600',
        teal: 'from-teal-500 to-emerald-600',
        rose: 'from-rose-500 to-red-600',
        violet: 'from-violet-500 to-indigo-600',
    };
    return (
        <div className="card overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${tones[tone]}`} />
            <div className="p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
                <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{value}</div>
                {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
            </div>
        </div>
    );
}
