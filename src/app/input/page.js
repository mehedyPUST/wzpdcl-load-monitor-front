'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import {
    Zap, Clock, Save, AlertCircle, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';

export default function InputPage() {
    return (
        <Protected roles={['operator']}>
            <InputForm />
        </Protected>
    );
}

const MODE_KEY = 'wzpdcl-input-mode';

function todayStr() {
    // Use local date (Asia/Dhaka on server, but browser-local here is fine)
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
    ).padStart(2, '0')}`;
}

function shiftDateStr(dateStr, days) {
    const [Y, M, D] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(Y, M - 1, D));
    dt.setUTCDate(dt.getUTCDate() + days);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
        dt.getUTCDate()
    ).padStart(2, '0')}`;
}

function InputForm() {
    const [mode, setMode] = useState('wzpdcl');
    const [date, setDate] = useState(todayStr());
    const [slotsData, setSlotsData] = useState(null);
    const [slotKey, setSlotKey] = useState(null);
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [, setTick] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem(MODE_KEY);
        if (saved === 'wzpdcl' || saved === 'both') setMode(saved);
    }, []);
    useEffect(() => {
        localStorage.setItem(MODE_KEY, mode);
    }, [mode]);

    useEffect(() => {
        const t = setInterval(() => setTick((x) => x + 1), 1000);
        return () => clearInterval(t);
    }, []);

    // Load slots whenever the date changes
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/load/slots?date=${date}`);
                setSlotsData(res.data);

                // Logical default: if date == today, use current/previous.
                // Otherwise, pick the last slot of that date.
                const isToday = date === todayStr();
                let def;
                if (isToday) {
                    def = res.data.current || res.data.previous;
                } else {
                    def = res.data.slots[res.data.slots.length - 1]?.slotKey || null;
                }
                setSlotKey(def);
            } catch (err) {
                toast.error(err.message || 'Failed to load slots');
            }
        })();
    }, [date]);

    const loadForm = useCallback(async () => {
        if (!slotKey) return;
        setLoading(true);
        try {
            const res = await api.get(`/load/form?slotKey=${slotKey}`);
            setForm(res.data);
        } catch (err) {
            toast.error(err.message || 'Failed to load form');
        } finally {
            setLoading(false);
        }
    }, [slotKey]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    const updateLocal = (substationId, patch) => {
        setForm((prev) => ({
            ...prev,
            rows: prev.rows.map((r) =>
                r.substationId === substationId
                    ? { ...r, entry: { ...(r.entry || {}), ...patch } }
                    : r
            ),
        }));
    };

    const saveRow = async (row) => {
        const e = row.entry || {};
        setSavingId(row.substationId);
        try {
            await api.post('/load/submit', {
                slotKey,
                substationId: row.substationId,
                actualLoad: e.actualLoad ?? '',
                pgcbAllotment: e.pgcbAllotment ?? '',
                loadshed: e.loadshed ?? '',
                pbsLoad: e.pbsLoad ?? '',
                pbsAllotment: e.pbsAllotment ?? '',
                pbsLoadshed: e.pbsLoadshed ?? '',
                note: e.note ?? '',
            });
            toast.success('Saved');
            await loadForm();
        } catch (err) {
            toast.error(err.message || 'Save failed');
        } finally {
            setSavingId(null);
        }
    };

    const goPreviousDay = () => setDate((d) => shiftDateStr(d, -1));
    const goNextDay = () => {
        const next = shiftDateStr(date, 1);
        if (next > todayStr()) return;
        setDate(next);
    };
    const goToday = () => setDate(todayStr());

    const isToday = date === todayStr();

    if (!slotsData) {
        return <div className="p-10 text-center text-slate-500">Loading slots…</div>;
    }

    const showPbs = mode === 'both';
    const editable = form?.editable;
    const isSpecial = form?.isSpecial;
    const win = form?.window;

    let countdown = '';
    if (win && editable) {
        const ms = new Date(win.closesAt).getTime() - Date.now();
        if (ms > 0) {
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            countdown = `${m}m ${s.toString().padStart(2, '0')}s`;
        }
    }

    const currentKey = slotsData.current;
    const previousKey = slotsData.previous;

    return (
        <div className="max-w-[1500px] mx-auto px-4 py-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-wzpdcl-border p-5 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-wzpdcl-blue flex items-center gap-2">
                            <Zap className="w-6 h-6" />
                            {form ? `${form.circle.name} Circle` : 'Circle'} — Hourly Load Input
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {form && (
                                <>
                                    · {form.totals.submitted}/{form.totalSubstations} substations submitted
                                </>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {editable && countdown && (
                            <span className="flex items-center gap-1 text-sm bg-green-50 text-green-800 px-3 py-1.5 rounded-md">
                                <Clock className="w-4 h-4" /> Closes in {countdown}
                            </span>
                        )}
                        {form && !editable && (
                            <span className="flex items-center gap-1 text-sm bg-red-50 text-red-800 px-3 py-1.5 rounded-md">
                                <AlertCircle className="w-4 h-4" /> Slot closed
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Date + Slot + Mode */}
            <div className="bg-white rounded-xl shadow-sm border border-wzpdcl-border p-4 mb-4 flex flex-wrap items-end gap-6">
                {/* Date navigation */}
                <div>
                    <label className="block text-xs text-slate-600 mb-1 font-semibold">Date</label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goPreviousDay}
                            title="Previous day"
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-md text-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Prev Day
                        </button>

                        <div className="flex items-center gap-1.5 border border-wzpdcl-border rounded-md px-2 py-1.5 bg-white">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <input
                                type="date"
                                value={date}
                                max={todayStr()}
                                onChange={(e) => setDate(e.target.value)}
                                className="text-sm focus:outline-none"
                            />
                        </div>

                        <button
                            onClick={goNextDay}
                            disabled={isToday}
                            title="Next day"
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-2 rounded-md text-sm"
                        >
                            Next Day
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {!isToday && (
                            <button
                                onClick={goToday}
                                className="text-xs text-wzpdcl-blue hover:underline px-2"
                            >
                                Today
                            </button>
                        )}
                    </div>
                </div>

                {/* Slot picker */}
                <div>
                    <label className="block text-xs text-slate-600 mb-1 font-semibold">Time Slot</label>
                    <select
                        value={slotKey || ''}
                        onChange={(e) => setSlotKey(e.target.value)}
                        className="border border-wzpdcl-border rounded-md px-3 py-2 text-sm min-w-[220px] focus:outline-none focus:ring-2 focus:ring-wzpdcl-blue"
                    >
                        {slotsData.slots.map((s) => {
                            const isCurrent = s.slotKey === currentKey;
                            const isPrev = s.slotKey === previousKey;
                            const tags = [];
                            if (isCurrent) tags.push('current');
                            else if (isPrev) tags.push('previous');
                            const tagStr = tags.length ? ` — ${tags.join(', ')}` : '';
                            return (
                                <option key={s.slotKey} value={s.slotKey}>
                                    {s.label}
                                    {s.isSpecial ? ' ★' : ''}
                                    {tagStr}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Mode */}
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-600 font-semibold">Input Mode:</span>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                            type="radio"
                            name="mode"
                            checked={mode === 'wzpdcl'}
                            onChange={() => setMode('wzpdcl')}
                            className="w-4 h-4 accent-wzpdcl-blue"
                        />
                        WZPDCL only
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                            type="radio"
                            name="mode"
                            checked={mode === 'both'}
                            onChange={() => setMode('both')}
                            className="w-4 h-4 accent-wzpdcl-green"
                        />
                        WZPDCL + PBS
                    </label>
                </div>
            </div>

            {/* Table */}
            {loading || !form ? (
                <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-wzpdcl-border">
                    Loading form…
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-wzpdcl-border overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-200 text-slate-800">
                                <th
                                    rowSpan={2}
                                    className="text-left px-3 py-2 font-semibold border border-slate-300 whitespace-nowrap"
                                >
                                    Grid Substation
                                </th>
                                <th
                                    colSpan={3}
                                    className="text-center px-3 py-2 font-bold border border-slate-300 bg-wzpdcl-blue text-white"
                                >
                                    WZPDCL
                                </th>
                                {showPbs && (
                                    <th
                                        colSpan={3}
                                        className="text-center px-3 py-2 font-bold border border-slate-300 bg-wzpdcl-green text-white"
                                    >
                                        PBS
                                    </th>
                                )}
                                <th
                                    rowSpan={2}
                                    className="text-left px-3 py-2 font-semibold border border-slate-300 whitespace-nowrap"
                                >
                                    Note
                                </th>
                                <th
                                    rowSpan={2}
                                    className="text-center px-3 py-2 font-semibold border border-slate-300"
                                >
                                    Action
                                </th>
                            </tr>
                            <tr className="bg-slate-100 text-slate-700">
                                <th className="text-right px-3 py-2 font-semibold border border-slate-300 whitespace-nowrap">
                                    Load (MW)
                                </th>
                                <th className="text-right px-3 py-2 font-semibold border border-slate-300 whitespace-nowrap">
                                    Allotment (MW)
                                </th>
                                <th className="text-right px-3 py-2 font-semibold border border-slate-300 whitespace-nowrap">
                                    LS (MW)
                                </th>
                                {showPbs && (
                                    <>
                                        <th className="text-right px-3 py-2 font-semibold border border-slate-300 bg-green-50 whitespace-nowrap">
                                            Load (MW)
                                        </th>
                                        <th className="text-right px-3 py-2 font-semibold border border-slate-300 bg-green-50 whitespace-nowrap">
                                            Allotment (MW)
                                        </th>
                                        <th className="text-right px-3 py-2 font-semibold border border-slate-300 bg-green-50 whitespace-nowrap">
                                            LS (MW)
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {form.rows.map((row) => {
                                const e = row.entry || {};
                                const ro = !row.editable;
                                return (
                                    <tr
                                        key={row.substationId}
                                        className={`border-t border-slate-300 ${row.editable ? 'bg-yellow-50/40' : ''}`}
                                    >
                                        <td className="px-3 py-2 font-medium text-slate-800 border border-slate-300 whitespace-nowrap">
                                            {row.substationName}
                                            {row.district && (
                                                <div className="text-xs text-slate-500">{row.district}</div>
                                            )}
                                        </td>

                                        <td className="px-3 py-2 text-right border border-slate-300">
                                            <NumInput
                                                value={e.actualLoad ?? ''}
                                                onChange={(v) => updateLocal(row.substationId, { actualLoad: v })}
                                                disabled={ro}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right border border-slate-300">
                                            <NumInput
                                                value={e.pgcbAllotment ?? ''}
                                                onChange={(v) => updateLocal(row.substationId, { pgcbAllotment: v })}
                                                disabled={ro}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right border border-slate-300">
                                            <NumInput
                                                value={e.loadshed ?? ''}
                                                onChange={(v) => updateLocal(row.substationId, { loadshed: v })}
                                                disabled={ro}
                                            />
                                        </td>

                                        {showPbs && (
                                            <>
                                                <td className="px-3 py-2 text-right border border-slate-300 bg-green-50/40">
                                                    <NumInput
                                                        value={e.pbsLoad ?? ''}
                                                        onChange={(v) => updateLocal(row.substationId, { pbsLoad: v })}
                                                        disabled={ro}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right border border-slate-300 bg-green-50/40">
                                                    <NumInput
                                                        value={e.pbsAllotment ?? ''}
                                                        onChange={(v) => updateLocal(row.substationId, { pbsAllotment: v })}
                                                        disabled={ro}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right border border-slate-300 bg-green-50/40">
                                                    <NumInput
                                                        value={e.pbsLoadshed ?? ''}
                                                        onChange={(v) => updateLocal(row.substationId, { pbsLoadshed: v })}
                                                        disabled={ro}
                                                    />
                                                </td>
                                            </>
                                        )}

                                        <td className="px-3 py-2 border border-slate-300">
                                            <input
                                                type="text"
                                                value={e.note ?? ''}
                                                onChange={(ev) => updateLocal(row.substationId, { note: ev.target.value })}
                                                disabled={ro}
                                                placeholder="optional"
                                                className="w-full min-w-[140px] border border-wzpdcl-border rounded px-2 py-1 text-xs disabled:bg-slate-100"
                                            />
                                        </td>

                                        <td className="px-3 py-2 text-center border border-slate-300">
                                            {row.editable ? (
                                                <button
                                                    onClick={() => saveRow(row)}
                                                    disabled={savingId === row.substationId}
                                                    className="inline-flex items-center gap-1 bg-wzpdcl-green hover:bg-green-800 text-white px-3 py-1.5 rounded text-xs disabled:opacity-60"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    {savingId === row.substationId
                                                        ? 'Saving…'
                                                        : e.enteredAt
                                                            ? 'Update'
                                                            : 'Save'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400">read-only</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            <tr className="bg-wzpdcl-blue text-white font-bold">
                                <td className="px-3 py-3 border border-slate-300">CIRCLE TOTAL</td>
                                <td className="px-3 py-3 text-right border border-slate-300">
                                    {fmt(form.totals.actualLoad)}
                                </td>
                                <td className="px-3 py-3 text-right border border-slate-300">
                                    {fmt(form.totals.pgcbAllotment)}
                                </td>
                                <td className="px-3 py-3 text-right border border-slate-300">
                                    {fmt(form.totals.loadshed)}
                                </td>
                                {showPbs && (
                                    <>
                                        <td className="px-3 py-3 text-right border border-slate-300 bg-wzpdcl-green">
                                            {fmt(form.totals.pbsLoad)}
                                        </td>
                                        <td className="px-3 py-3 text-right border border-slate-300 bg-wzpdcl-green">
                                            {fmt(form.totals.pbsAllotment)}
                                        </td>
                                        <td className="px-3 py-3 text-right border border-slate-300 bg-wzpdcl-green">
                                            {fmt(form.totals.pbsLoadshed)}
                                        </td>
                                    </>
                                )}
                                <td className="px-3 py-3 border border-slate-300" colSpan={2}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            <p className="text-xs text-slate-500 mt-3">
                Tip: Use <strong>Prev Day</strong> to backfill or view earlier data, or the date picker to
                jump to any date. Slots marked <strong>★</strong> are the special peak slots (18:30 &amp;
                19:30).
            </p>
        </div>
    );
}

function NumInput({ value, onChange, disabled }) {
    return (
        <input
            type="number"
            step="0.01"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-24 text-right border border-wzpdcl-border rounded px-2 py-1 disabled:bg-slate-100"
        />
    );
}

function fmt(n) {
    return (Number(n) || 0).toFixed(2);
}