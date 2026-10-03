'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    RefreshCw,
    Search,
    Table2,
    LayoutList,
} from 'lucide-react';

function todayDhaka() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

function fmt(v) {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
    return Number(v).toFixed(2);
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function countdown(closesAt) {
    if (!closesAt) return null;
    const ms = new Date(closesAt).getTime() - Date.now();
    if (ms <= 0) return 'closed';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m ${pad2(sec)}s`;
}

export default function AdminDashboard() {
    return (
        <Protected roles={['admin']}>
            <Dash />
        </Protected>
    );
}

function Dash() {
    const [data, setData] = useState(null);
    const [date, setDate] = useState(todayDhaka());
    const [slotKey, setSlotKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all | submitted | pending
    const [view, setView] = useState('table'); // table | circle
    const [q, setQ] = useState('');
    const [expanded, setExpanded] = useState({});
    const [tick, setTick] = useState(0);
    const [updatedAt, setUpdatedAt] = useState(null);

    const load = useCallback(async (d, key) => {
        setError('');
        try {
            const params = new URLSearchParams();
            if (d) params.set('date', d);
            if (key) params.set('slotKey', key);
            const res = await api.get(`/load/current-status?${params.toString()}`);
            setData(res.data);
            if (res.data.date) setDate(res.data.date);
            if (res.data.slotKey) setSlotKey(res.data.slotKey);
            setUpdatedAt(new Date());
            // Expand circles that still have pending
            setExpanded((prev) => {
                if (Object.keys(prev).length) return prev;
                const next = {};
                for (const c of res.data.circles || []) {
                    if (c.pending > 0) next[c.circleId] = true;
                }
                return next;
            });
        } catch (e) {
            const msg = e.message || 'Failed to load dashboard';
            if (e.status === 401 || /not authenticated/i.test(msg)) {
                setError('Session expired — please log in again as admin.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        load(date, slotKey);
        const t = setInterval(() => load(date, slotKey), 20000);
        return () => clearInterval(t);
    }, [load, date, slotKey]);

    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const remaining = useMemo(
        () => countdown(data?.closesAt),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [data?.closesAt, tick]
    );

    const totals = data?.totals || {
        actualLoad: 0,
        pgcbAllotment: 0,
        loadshed: 0,
        pbsLoad: 0,
        submitted: 0,
        pending: 0,
        totalSubstations: 0,
    };

    const pct =
        totals.totalSubstations > 0
            ? Math.round((totals.submitted / totals.totalSubstations) * 100)
            : 0;

    const needle = q.trim().toLowerCase();

    const pendingList = useMemo(() => {
        const rows = [];
        for (const c of data?.circles || []) {
            for (const ss of c.substations || []) {
                if (!ss.submitted) {
                    rows.push({ circleName: c.circleName, ...ss });
                }
            }
        }
        return rows;
    }, [data]);

    // Flat rows for master table
    const flatRows = useMemo(() => {
        const rows = [];
        for (const c of data?.circles || []) {
            for (const ss of c.substations || []) {
                rows.push({
                    circleId: c.circleId,
                    circleName: c.circleName,
                    ...ss,
                });
            }
        }
        return rows.filter((r) => {
            if (filter === 'submitted' && !r.submitted) return false;
            if (filter === 'pending' && r.submitted) return false;
            if (needle) {
                const hay = `${r.circleName} ${r.substationName} ${r.district || ''}`.toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            return true;
        });
    }, [data, filter, needle]);

    const filteredCircles = useMemo(() => {
        return (data?.circles || [])
            .map((c) => {
                const substations = (c.substations || []).filter((ss) => {
                    if (filter === 'submitted' && !ss.submitted) return false;
                    if (filter === 'pending' && ss.submitted) return false;
                    if (needle) {
                        const hay = `${c.circleName} ${ss.substationName} ${ss.district || ''}`.toLowerCase();
                        if (!hay.includes(needle)) return false;
                    }
                    return true;
                });
                return { ...c, substations };
            })
            .filter((c) => c.substations.length > 0 || (!needle && filter === 'all'));
    }, [data, filter, needle]);

    const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

    const onDateChange = (v) => {
        setSlotKey('');
        setDate(v);
        setExpanded({});
    };

    const onSlotChange = (v) => {
        setSlotKey(v);
        setExpanded({});
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-700" />
                        Hourly Input Monitor
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Live progress of SBA data entry by circle &amp; substation
                    </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="border rounded-lg px-2 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Hour slot</label>
                        <select
                            value={slotKey}
                            onChange={(e) => onSlotChange(e.target.value)}
                            className="border rounded-lg px-2 py-1.5 text-sm min-w-[120px]"
                        >
                            {(data?.slots || []).map((s) => (
                                <option key={s.slotKey} value={s.slotKey}>
                                    {s.label}
                                    {s.isCurrent ? ' ●' : ''}
                                    {s.isSpecial ? ' (peak)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => load(date, slotKey)}
                        className="inline-flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Slot status bar */}
            <div className="bg-slate-800 text-white rounded-xl px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 opacity-80" />
                    <span>
                        Slot:{' '}
                        <strong className="text-base">{data?.label || '—'}</strong>
                        {data?.isLive && (
                            <span className="ml-2 text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                                LIVE
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                    {remaining && (
                        <span>
                            Closes in:{' '}
                            <strong
                                className={
                                    remaining === 'closed' ? 'text-red-300' : 'text-white'
                                }
                            >
                                {remaining}
                            </strong>
                        </span>
                    )}
                    {updatedAt && (
                        <span className="text-xs opacity-70">
                            Updated {updatedAt.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
                <Kpi
                    title="Submitted"
                    value={`${totals.submitted}/${totals.totalSubstations}`}
                    sub={`${pct}% complete`}
                    color="bg-emerald-600"
                />
                <Kpi
                    title="Pending"
                    value={String(totals.pending)}
                    sub="not entered yet"
                    color="bg-amber-600"
                />
                <Kpi
                    title="Actual Load"
                    value={fmt(totals.actualLoad)}
                    sub="MW total"
                    color="bg-sky-700"
                />
                <Kpi
                    title="PGCB Allotment"
                    value={fmt(totals.pgcbAllotment)}
                    sub="MW total"
                    color="bg-emerald-700"
                />
                <Kpi
                    title="Loadshed"
                    value={fmt(totals.loadshed)}
                    sub="MW total"
                    color="bg-red-600"
                />
                <Kpi
                    title="Demand"
                    value={fmt((Number(totals.actualLoad)||0)+(Number(totals.loadshed)||0))}
                    sub="Actual + LS"
                    color="bg-violet-600"
                />
                <Kpi
                    title="PBS Load"
                    value={fmt(totals.pbsLoad)}
                    sub="MW total"
                    color="bg-slate-700"
                />
            </div>

            {/* Progress */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">
                        Input progress this hour
                    </span>
                    <span className="text-slate-500">
                        {totals.submitted} of {totals.totalSubstations} substations
                    </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className={`h-full transition-all ${
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

            {/* Pending strip */}
            {pendingList.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Pending this hour ({pendingList.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {pendingList.map((ss) => (
                            <span
                                key={ss.substationId}
                                className="text-[11px] bg-white border border-amber-200 text-amber-900 rounded-full px-2.5 py-1"
                            >
                                {ss.circleName} · {ss.substationName}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search circle / SS…"
                            className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-48"
                        />
                    </div>
                    {['all', 'submitted', 'pending'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-xs px-3 py-1.5 rounded-full border capitalize ${
                                filter === f
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-white">
                    <button
                        onClick={() => setView('table')}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md ${
                            view === 'table' ? 'bg-slate-800 text-white' : 'text-slate-600'
                        }`}
                    >
                        <Table2 className="w-3.5 h-3.5" /> Table
                    </button>
                    <button
                        onClick={() => setView('circle')}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md ${
                            view === 'circle' ? 'bg-slate-800 text-white' : 'text-slate-600'
                        }`}
                    >
                        <LayoutList className="w-3.5 h-3.5" /> By circle
                    </button>
                </div>
            </div>

            {loading && !data && (
                <p className="text-center text-slate-500 py-12">Loading…</p>
            )}

            {/* Master table view */}
            {view === 'table' && data && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                            <tr>
                                <th className="text-center px-2 py-2.5 w-10">SN</th>
                                <th className="text-left px-3 py-2.5">Circle</th>
                                <th className="text-left px-3 py-2.5">Grid SS</th>
                                <th className="text-center px-3 py-2.5">Status</th>
                                <th className="text-right px-3 py-2.5">Actual (MW)</th>
                                <th className="text-right px-3 py-2.5">Allotment (MW)</th>
                                <th className="text-right px-3 py-2.5">Loadshed (MW)</th>
                                <th className="text-right px-3 py-2.5">Demand (MW)</th>
                                <th className="text-right px-3 py-2.5">PBS (MW)</th>
                                <th className="text-left px-3 py-2.5">Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flatRows.map((r, i) => (
                                <tr
                                    key={r.substationId}
                                    className={`border-t ${
                                        r.submitted
                                            ? i % 2 === 1
                                                ? 'bg-slate-50'
                                                : 'bg-white'
                                            : i % 2 === 1
                                              ? 'bg-amber-50'
                                              : 'bg-amber-50/50'
                                    }`}
                                >
                                    <td className="px-2 py-2 text-center text-slate-500 tabular-nums">
                                        {i + 1}
                                    </td>
                                    <td className="px-3 py-2 font-medium text-slate-800">
                                        {r.circleName}
                                    </td>
                                    <td className="px-3 py-2">
                                        {r.substationName}
                                        {r.district ? (
                                            <span className="text-xs text-slate-400 ml-1">
                                                ({r.district})
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        {r.submitted ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {fmt(r.actualLoad)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {fmt(r.pgcbAllotment)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {fmt(r.loadshed)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                                        {fmt((Number(r.actualLoad)||0)+(Number(r.loadshed)||0))}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {fmt(r.pbsLoad)}
                                    </td>
                                    <td className="px-3 py-2 text-slate-500 text-xs max-w-[140px] truncate">
                                        {r.note || '—'}
                                    </td>
                                </tr>
                            ))}
                            {flatRows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="text-center py-8 text-slate-500"
                                    >
                                        No substations match this filter
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {flatRows.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                                    <td className="px-2 py-2.5" />
                                    <td className="px-3 py-2.5" colSpan={2}>
                                        WZPDCL total
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-xs font-normal text-slate-600">
                                        {totals.submitted}/{totals.totalSubstations}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {fmt(totals.actualLoad)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {fmt(totals.pgcbAllotment)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {fmt(totals.loadshed)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {fmt((Number(totals.actualLoad)||0)+(Number(totals.loadshed)||0))}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {fmt(totals.pbsLoad)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}

            {/* By-circle expandable view */}
            {view === 'circle' && data && (
                <div className="space-y-3">
                    {filteredCircles.map((c) => {
                        const open = expanded[c.circleId];
                        const cPct =
                            c.totalSubstations > 0
                                ? Math.round((c.submitted / c.totalSubstations) * 100)
                                : 0;
                        return (
                            <div
                                key={c.circleId}
                                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(c.circleId)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                                >
                                    {open ? (
                                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-slate-800">
                                                {c.circleName}
                                            </span>
                                            <span
                                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                                    c.pending === 0
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {c.submitted}/{c.totalSubstations} · {cPct}%
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 max-w-xs overflow-hidden">
                                            <div
                                                className={`h-full ${
                                                    cPct === 100
                                                        ? 'bg-emerald-500'
                                                        : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${cPct}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="hidden md:flex items-center gap-4 text-xs text-slate-600 tabular-nums">
                                        <span>Act {fmt(c.totals?.actualLoad)}</span>
                                        <span>Allot {fmt(c.totals?.pgcbAllotment)}</span>
                                        <span>LS {fmt(c.totals?.loadshed)}</span>
                                    </div>
                                </button>

                                {open && (
                                    <div className="border-t overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-slate-600 text-xs">
                                                <tr>
                                                    <th className="text-left px-4 py-2">
                                                        Grid SS
                                                    </th>
                                                    <th className="text-center px-3 py-2">
                                                        Status
                                                    </th>
                                                    <th className="text-right px-3 py-2">
                                                        Actual
                                                    </th>
                                                    <th className="text-right px-3 py-2">
                                                        Allotment
                                                    </th>
                                                    <th className="text-right px-3 py-2">
                                                        Loadshed
                                                    </th>
                                                    <th className="text-right px-3 py-2">
                                                        PBS
                                                    </th>
                                                    <th className="text-left px-3 py-2">
                                                        Note
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {c.substations.map((ss) => (
                                                    <tr
                                                        key={ss.substationId}
                                                        className={`border-t ${
                                                            ss.submitted
                                                                ? ''
                                                                : 'bg-amber-50/50'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-2">
                                                            {ss.substationName}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {ss.submitted ? (
                                                                <span className="text-emerald-700 text-xs font-medium">
                                                                    Done
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-700 text-xs font-medium">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {fmt(ss.actualLoad)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {fmt(ss.pgcbAllotment)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {fmt(ss.loadshed)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {fmt(ss.pbsLoad)}
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-slate-500">
                                                            {ss.note || '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-50 border-t font-semibold text-sm">
                                                    <td className="px-4 py-2" colSpan={2}>
                                                        Circle total
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
                                                    <td />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredCircles.length === 0 && (
                        <p className="text-center text-slate-500 py-8">
                            No circles match this filter
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function Kpi({ title, value, sub, color }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className={`h-1 ${color}`} />
            <div className="p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {title}
                </div>
                <div className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">
                    {value}
                </div>
                {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}
