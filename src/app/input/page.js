'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Protected from '@/components/Protected';
import { Zap, Clock, Save, ChevronLeft, ChevronRight } from 'lucide-react';

export default function InputPage() {
    return (
        <Protected roles={['operator', 'admin']}>
            <InputForm />
        </Protected>
    );
}

const MODE_KEY = 'wzpdcl-input-mode';

function todayStr() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

function shiftDateStr(dateStr, days) {
    const [Y, M, D] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(Y, M - 1, D));
    dt.setUTCDate(dt.getUTCDate() + days);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
        dt.getUTCDate()
    ).padStart(2, '0')}`;
}

function fmt(n) {
    return (Number(n) || 0).toFixed(2);
}

function InputForm() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [mode, setMode] = useState('wzpdcl');
    const [date, setDate] = useState(todayStr());
    const [slotsData, setSlotsData] = useState(null);
    const [slotKey, setSlotKey] = useState(null);
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [circles, setCircles] = useState([]);
    const [circleFilter, setCircleFilter] = useState('all'); // admin: all | circleId
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

    useEffect(() => {
        if (!isAdmin) return;
        api
            .get('/public/circles')
            .then((r) => setCircles(r.data.circles || []))
            .catch(() => {});
    }, [isAdmin]);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/load/slots?date=${date}`);
                setSlotsData(res.data);
                const isToday = date === todayStr();
                let def;
                if (isToday) def = res.data.current || res.data.previous;
                else def = res.data.slots[res.data.slots.length - 1]?.slotKey || null;
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
            const params = new URLSearchParams({ slotKey });
            if (isAdmin) {
                if (circleFilter && circleFilter !== 'all') {
                    params.set('circleId', circleFilter);
                }
                // omit circleId → backend returns all
            }
            const res = await api.get(`/load/form?${params.toString()}`);
            setForm(res.data);
        } catch (err) {
            toast.error(err.message || 'Failed to load form');
            setForm(null);
        } finally {
            setLoading(false);
        }
    }, [slotKey, isAdmin, circleFilter]);

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
            toast.success(`Saved: ${row.substationName}`);
            await loadForm();
        } catch (err) {
            toast.error(err.message || 'Save failed');
        } finally {
            setSavingId(null);
        }
    };

    const editable = form?.editable;
    const showPbs = mode === 'both';
    const multi = form?.multiCircle;
    const currentKey = slotsData?.current;
    const previousKey = slotsData?.previous;

    let countdown = null;
    const win = form?.window;
    if (win && editable) {
        const closes = new Date(win.closesAt).getTime();
        const ms = closes - Date.now();
        if (ms > 0) {
            const s = Math.floor(ms / 1000);
            const m = Math.floor(s / 60);
            const sec = s % 60;
            countdown = `${m}m ${String(sec).padStart(2, '0')}s`;
        } else countdown = 'closed';
    }

    const title = isAdmin
        ? multi
            ? 'All circles — Admin load input'
            : form?.circle?.name
              ? `${form.circle.name} Circle — Admin input`
              : 'Admin load input'
        : form?.circle?.name
          ? `${form.circle.name} Circle — Hourly Load Input`
          : 'Hourly Load Input';

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-blue-700" />
                        {title}
                    </h1>
                    {form && (
                        <p className="text-sm text-slate-500 mt-1">
                            {form.totals?.submitted ?? 0}/{form.totalSubstations ?? 0}{' '}
                            substations submitted
                            {isAdmin && ' · you can edit every row'}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    {editable && countdown && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5">
                            <Clock className="w-4 h-4" /> Closes in {countdown}
                        </span>
                    )}
                    {form && !editable && (
                        <span className="text-xs text-slate-500 border rounded-lg px-3 py-1.5">
                            View only for this slot
                        </span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Date</label>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setDate(shiftDateStr(date, -1))}
                            className="border rounded p-1.5 hover:bg-slate-50"
                            title="Previous day"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border rounded-lg px-2 py-1.5 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setDate(shiftDateStr(date, 1))}
                            className="border rounded p-1.5 hover:bg-slate-50"
                            title="Next day"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Hour slot</label>
                    <select
                        value={slotKey || ''}
                        onChange={(e) => setSlotKey(e.target.value)}
                        className="border rounded-lg px-2 py-1.5 text-sm min-w-[130px]"
                    >
                        {(slotsData?.slots || []).map((s) => (
                            <option key={s.slotKey} value={s.slotKey}>
                                {s.label}
                                {s.slotKey === currentKey ? ' ●' : ''}
                                {s.slotKey === previousKey ? ' (prev)' : ''}
                                {s.isSpecial ? ' ★' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {isAdmin && (
                    <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">
                            Circle filter
                        </label>
                        <select
                            value={circleFilter}
                            onChange={(e) => setCircleFilter(e.target.value)}
                            className="border rounded-lg px-2 py-1.5 text-sm min-w-[160px]"
                        >
                            <option value="all">All circles</option>
                            {circles.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Columns</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="border rounded-lg px-2 py-1.5 text-sm"
                    >
                        <option value="wzpdcl">WZPDCL only</option>
                        <option value="both">WZPDCL + PBS</option>
                    </select>
                </div>
            </div>

            {loading || !form ? (
                <p className="text-center text-slate-500 py-12">Loading form…</p>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="px-2 py-2.5 text-center w-12">SN</th>
                                {(isAdmin || multi) && (
                                    <th className="px-3 py-2.5 text-left">Circle</th>
                                )}
                                <th className="px-3 py-2.5 text-left">Grid SS</th>
                                <th className="px-3 py-2.5 text-right">Actual (MW)</th>
                                <th className="px-3 py-2.5 text-right">Allotment (MW)</th>
                                <th className="px-3 py-2.5 text-right">Loadshed (MW)</th>
                                {showPbs && (
                                    <>
                                        <th className="px-3 py-2.5 text-right bg-emerald-900">
                                            PBS Load
                                        </th>
                                        <th className="px-3 py-2.5 text-right bg-emerald-900">
                                            PBS Allot
                                        </th>
                                        <th className="px-3 py-2.5 text-right bg-emerald-900">
                                            PBS LS
                                        </th>
                                    </>
                                )}
                                <th className="px-3 py-2.5 text-left">Note</th>
                                <th className="px-3 py-2.5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(form.rows || []).map((row, idx) => {
                                const e = row.entry || {};
                                const ro = !row.editable;
                                const alt = idx % 2 === 1;
                                return (
                                    <tr
                                        key={row.substationId}
                                        className={`border-t border-slate-200 ${
                                            row.editable
                                                ? alt
                                                    ? 'bg-amber-50/70'
                                                    : 'bg-amber-50/30'
                                                : alt
                                                  ? 'bg-slate-50'
                                                  : 'bg-white'
                                        }`}
                                    >
                                        <td className="px-2 py-2 text-center text-slate-500 tabular-nums">
                                            {idx + 1}
                                        </td>
                                        {(isAdmin || multi) && (
                                            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                                {row.circleName || '—'}
                                            </td>
                                        )}
                                        <td className="px-3 py-2 font-medium">
                                            {row.substationName}
                                            {row.isMine && (
                                                <span className="ml-1 text-[10px] text-blue-700">
                                                    (you)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <NumInput
                                                value={e.actualLoad}
                                                disabled={ro}
                                                onChange={(v) =>
                                                    updateLocal(row.substationId, {
                                                        actualLoad: v,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <NumInput
                                                value={e.pgcbAllotment}
                                                disabled={ro}
                                                onChange={(v) =>
                                                    updateLocal(row.substationId, {
                                                        pgcbAllotment: v,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <NumInput
                                                value={e.loadshed}
                                                disabled={ro}
                                                onChange={(v) =>
                                                    updateLocal(row.substationId, {
                                                        loadshed: v,
                                                    })
                                                }
                                            />
                                        </td>
                                        {showPbs && (
                                            <>
                                                <td className="px-3 py-2 text-right">
                                                    <NumInput
                                                        value={e.pbsLoad}
                                                        disabled={ro}
                                                        onChange={(v) =>
                                                            updateLocal(row.substationId, {
                                                                pbsLoad: v,
                                                            })
                                                        }
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <NumInput
                                                        value={e.pbsAllotment}
                                                        disabled={ro}
                                                        onChange={(v) =>
                                                            updateLocal(row.substationId, {
                                                                pbsAllotment: v,
                                                            })
                                                        }
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <NumInput
                                                        value={e.pbsLoadshed}
                                                        disabled={ro}
                                                        onChange={(v) =>
                                                            updateLocal(row.substationId, {
                                                                pbsLoadshed: v,
                                                            })
                                                        }
                                                    />
                                                </td>
                                            </>
                                        )}
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={e.note || ''}
                                                disabled={ro}
                                                onChange={(ev) =>
                                                    updateLocal(row.substationId, {
                                                        note: ev.target.value,
                                                    })
                                                }
                                                className="w-28 border rounded px-2 py-1 text-xs disabled:bg-slate-100"
                                                placeholder="Note"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {row.editable ? (
                                                <button
                                                    type="button"
                                                    onClick={() => saveRow(row)}
                                                    disabled={savingId === row.substationId}
                                                    className="inline-flex items-center gap-1 bg-blue-800 text-white text-xs px-2.5 py-1.5 rounded hover:bg-blue-900 disabled:opacity-50"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    {savingId === row.substationId
                                                        ? '…'
                                                        : 'Save'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    {row.entry ? 'Done' : '—'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                                <td className="px-2 py-2.5" />
                                {(isAdmin || multi) && (
                                    <td className="px-3 py-2.5">Total</td>
                                )}
                                <td className="px-3 py-2.5">
                                    {!(isAdmin || multi) ? 'Circle total' : ''}
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums">
                                    {fmt(form.totals?.actualLoad)}
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums">
                                    {fmt(form.totals?.pgcbAllotment)}
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums">
                                    {fmt(form.totals?.loadshed)}
                                </td>
                                {showPbs && (
                                    <>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            {fmt(form.totals?.pbsLoad)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            {fmt(form.totals?.pbsAllotment)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums">
                                            {fmt(form.totals?.pbsLoadshed)}
                                        </td>
                                    </>
                                )}
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <p className="text-xs text-slate-500 mt-3">
                ★ Special peak slots: <strong>17:30</strong> &amp; <strong>18:30</strong>.
                {isAdmin && (
                    <>
                        {' '}
                        As admin you can enter data for <strong>any</strong> substation in any
                        circle (filter above).
                    </>
                )}
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
            className="w-24 text-right border border-slate-300 rounded px-2 py-1 disabled:bg-slate-100"
        />
    );
}
