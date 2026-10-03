'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Protected from '@/components/Protected';

function today() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

function formatSlotLabel(slotKey) {
    // slotKey: 2026-10-02T18:30 or 2026-10-02T10:00
    if (!slotKey || !slotKey.includes('T')) return slotKey || '—';
    const time = slotKey.split('T')[1] || '';
    return time;
}

function formatDayLabel(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function fmt(v) {
    return num(v).toFixed(2);
}

export default function HistoryPage() {
    return (
        <Protected roles={['operator', 'admin', 'viewer']}>
            <History />
        </Protected>
    );
}

function History() {
    const { user } = useAuth();
    const [circleId, setCircleId] = useState('');
    const [circles, setCircles] = useState([]);
    const [from, setFrom] = useState(today());
    const [to, setTo] = useState(today());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'operator') setCircleId(user.circleId);
        else {
            api.get('/public/circles').then((r) => setCircles(r.data.circles || []));
        }
    }, [user]);

    const load = async () => {
        if (!circleId || !from || !to) return;
        setLoading(true);
        try {
            const res = await api.get(
                `/load/history?circleId=${circleId}&from=${from}&to=${to}`
            );
            setRows(res.data.rows || []);
        } catch (err) {
            alert(err.message || 'Failed to load history');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (circleId) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [circleId]);

    // Group hourly rows by day (YYYY-MM-DD from slotKey)
    const byDay = useMemo(() => {
        const map = {};
        for (const row of rows) {
            const day = (row.slotKey || '').slice(0, 10);
            if (!day) continue;
            if (!map[day]) map[day] = [];
            map[day].push(row);
        }
        // sort days descending (newest first), slots ascending within day
        return Object.keys(map)
            .sort((a, b) => b.localeCompare(a))
            .map((day) => ({
                day,
                slots: map[day].sort((a, b) =>
                    (a.slotKey || '').localeCompare(b.slotKey || '')
                ),
                dayTotals: map[day].reduce(
                    (acc, r) => {
                        acc.actualLoad += num(r.totals?.actualLoad);
                        acc.pgcbAllotment += num(r.totals?.pgcbAllotment);
                        acc.loadshed += num(r.totals?.loadshed);
                        acc.pbsLoad += num(r.totals?.pbsLoad);
                        return acc;
                    },
                    { actualLoad: 0, pgcbAllotment: 0, loadshed: 0, pbsLoad: 0 }
                ),
            }));
    }, [rows]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-wzpdcl-blue mb-4">
                Load History (by Day)
            </h1>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap items-end gap-3">
                {user?.role !== 'operator' && (
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">
                            Circle
                        </label>
                        <select
                            value={circleId}
                            onChange={(e) => setCircleId(e.target.value)}
                            className="border rounded px-2 py-1.5 text-sm min-w-[160px]"
                        >
                            <option value="">Select circle</option>
                            {circles.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-xs text-slate-600 mb-1">From</label>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="border rounded px-2 py-1.5 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-600 mb-1">To</label>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="border rounded px-2 py-1.5 text-sm"
                    />
                </div>
                <button
                    onClick={load}
                    disabled={loading || !circleId}
                    className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-medium"
                >
                    {loading ? 'Loading…' : 'Load'}
                </button>
            </div>

            {loading && (
                <p className="text-center text-slate-500 py-8">Loading…</p>
            )}

            {!loading && byDay.length === 0 && (
                <p className="text-center text-slate-500 py-8">
                    No data for the selected range.
                </p>
            )}

            {!loading &&
                byDay.map(({ day, slots, dayTotals }) => (
                    <div
                        key={day}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6"
                    >
                        {/* Day header */}
                        <div className="bg-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="font-semibold text-lg">
                                {formatDayLabel(day)}
                            </h2>
                            <div className="text-xs sm:text-sm text-slate-200 flex flex-wrap gap-3">
                                <span>
                                    Actual:{' '}
                                    <strong>{fmt(dayTotals.actualLoad)}</strong> MW
                                </span>
                                <span>
                                    PGCB:{' '}
                                    <strong>{fmt(dayTotals.pgcbAllotment)}</strong> MW
                                </span>
                                <span>
                                    Loadshed:{' '}
                                    <strong>{fmt(dayTotals.loadshed)}</strong> MW
                                </span>
                                <span>
                                    PBS:{' '}
                                    <strong>{fmt(dayTotals.pbsLoad)}</strong> MW
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="text-left px-3 py-2">
                                            Time
                                        </th>
                                        <th className="text-right px-3 py-2">
                                            Actual Load (MW)
                                        </th>
                                        <th className="text-right px-3 py-2">
                                            PGCB Allotment (MW)
                                        </th>
                                        <th className="text-right px-3 py-2">
                                            Loadshed (MW)
                                        </th>
                                        <th className="text-right px-3 py-2">
                                            PBS Load (MW)
                                        </th>
                                        <th className="text-right px-3 py-2">
                                            Submitted
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slots.map((row) => (
                                        <tr
                                            key={row.slotKey}
                                            className="border-t border-slate-100 hover:bg-slate-50"
                                        >
                                            <td className="px-3 py-2 font-medium text-slate-800">
                                                {formatSlotLabel(row.slotKey)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {fmt(row.totals?.actualLoad)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {fmt(row.totals?.pgcbAllotment)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {fmt(row.totals?.loadshed)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {fmt(row.totals?.pbsLoad)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-600">
                                                {row.submitted ?? 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                                        <td className="px-3 py-2">Day total</td>
                                        <td className="px-3 py-2 text-right">
                                            {fmt(dayTotals.actualLoad)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {fmt(dayTotals.pgcbAllotment)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {fmt(dayTotals.loadshed)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {fmt(dayTotals.pbsLoad)}
                                        </td>
                                        <td className="px-3 py-2 text-right">—</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ))}
        </div>
    );
}
