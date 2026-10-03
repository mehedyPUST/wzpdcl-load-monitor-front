'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Protected from '@/components/Protected';
import Spinner from '@/components/ui/Spinner';
import { SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton';
import DaySummaryDownload from '@/components/DaySummaryDownload';
import {
    Zap,
    Clock,
    Save,
    ChevronLeft,
    ChevronRight,
    SaveAll,
} from 'lucide-react';

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

function n(v) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
}

function fmt(v) {
    return n(v).toFixed(2);
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
    const [savingAll, setSavingAll] = useState(false);
    const [circles, setCircles] = useState([]);
    const [circleFilter, setCircleFilter] = useState('all');
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
        api.get('/public/circles')
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
            if (isAdmin && circleFilter && circleFilter !== 'all') {
                params.set('circleId', circleFilter);
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
        setForm((prev) => {
            if (!prev) return prev;
            const rows = prev.rows.map((r) =>
                r.substationId === substationId
                    ? { ...r, entry: { ...(r.entry || {}), ...patch }, _dirty: true }
                    : r
            );
            return { ...prev, rows, totals: recomputeTotals(rows) };
        });
    };

    const markSaved = (substationId) => {
        setForm((prev) => {
            if (!prev) return prev;
            const rows = prev.rows.map((r) =>
                r.substationId === substationId
                    ? { ...r, _dirty: false, entry: { ...(r.entry || {}) } }
                    : r
            );
            // ensure entry exists so "Done" shows
            return {
                ...prev,
                rows,
                totals: {
                    ...recomputeTotals(rows),
                    submitted: rows.filter((r) => r.entry && hasAnyValue(r.entry)).length,
                },
            };
        });
    };

    const saveRow = async (row, { silent } = {}) => {
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
            markSaved(row.substationId);
            if (!silent) toast.success(`Saved · ${row.substationName}`);
            return true;
        } catch (err) {
            if (!silent) toast.error(err.message || 'Save failed');
            return false;
        } finally {
            setSavingId(null);
        }
    };

    const saveAll = async () => {
        if (!form?.rows?.length) return;
        const targets = form.rows.filter((r) => r.editable);
        if (!targets.length) return toast.error('Nothing to save');

        setSavingAll(true);
        try {
            const entries = targets.map((r) => ({
                substationId: r.substationId,
                actualLoad: r.entry?.actualLoad ?? '',
                pgcbAllotment: r.entry?.pgcbAllotment ?? '',
                loadshed: r.entry?.loadshed ?? '',
                pbsLoad: r.entry?.pbsLoad ?? '',
                pbsAllotment: r.entry?.pbsAllotment ?? '',
                pbsLoadshed: r.entry?.pbsLoadshed ?? '',
                note: r.entry?.note ?? '',
            }));

            const res = await api.post('/load/submit-bulk', { slotKey, entries });
            // mark all editable as saved locally without reload
            setForm((prev) => {
                if (!prev) return prev;
                const rows = prev.rows.map((r) =>
                    r.editable ? { ...r, _dirty: false } : r
                );
                return {
                    ...prev,
                    rows,
                    totals: {
                        ...recomputeTotals(rows),
                        submitted: rows.filter((r) => r.entry && hasAnyValue(r.entry)).length,
                    },
                };
            });
            toast.success(`Saved ${res.data.saved} row(s)`);
            if (res.data.failed) toast.error(`${res.data.failed} failed`);
        } catch (err) {
            toast.error(err.message || 'Bulk save failed');
        } finally {
            setSavingAll(false);
        }
    };

    const stats = useMemo(() => {
        const rows = form?.rows || [];
        let actual = 0;
        let allot = 0;
        let ls = 0;
        let pbs = 0;
        let submitted = 0;
        for (const r of rows) {
            const e = r.entry;
            if (!e || !hasAnyValue(e)) continue;
            submitted += 1;
            actual += n(e.actualLoad);
            allot += n(e.pgcbAllotment);
            ls += n(e.loadshed);
            pbs += n(e.pbsLoad);
        }
        return {
            actual,
            allot,
            ls,
            demand: actual + ls,
            pbs,
            submitted,
            total: rows.length,
        };
    }, [form]);

    const editable = form?.editable;
    const showPbs = mode === 'both';
    const multi = form?.multiCircle || isAdmin;
    const currentKey = slotsData?.current;
    const previousKey = slotsData?.previous;

    let countdown = null;
    const win = form?.window;
    if (win && editable) {
        const ms = new Date(win.closesAt).getTime() - Date.now();
        if (ms > 0) {
            const s = Math.floor(ms / 1000);
            const m = Math.floor(s / 60);
            countdown = `${m}m ${String(s % 60).padStart(2, '0')}s`;
        } else countdown = 'closed';
    }

    const title = isAdmin
        ? multi && circleFilter === 'all'
            ? 'Admin input · All circles'
            : `Admin input · ${form?.circle?.name || 'Circle'}`
        : `${form?.circle?.name || 'Circle'} · Hourly input`;

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-sm">
                            <Zap className="w-5 h-5" />
                        </span>
                        {title}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Demand = Actual Load + Loadshed · autosave stays local until you click Save
                    </p>
                </div>
                <DaySummaryDownload />
            </div>

            {/* Stats */}
            {loading && !form ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <Stat label="Actual Load" value={`${fmt(stats.actual)} MW`} tone="sky" />
                    <Stat label="Allotment" value={`${fmt(stats.allot)} MW`} tone="teal" />
                    <Stat label="Loadshed" value={`${fmt(stats.ls)} MW`} tone="rose" />
                    <Stat
                        label="Demand"
                        value={`${fmt(stats.demand)} MW`}
                        sub="Actual + Loadshed"
                        tone="violet"
                    />
                    <Stat
                        label="Progress"
                        value={`${stats.submitted}/${stats.total}`}
                        sub="substations"
                        tone="amber"
                    />
                </div>
            )}

            {/* Controls */}
            <div className="card p-4 flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                        Date
                    </label>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setDate(shiftDateStr(date, -1))}
                            className="border border-slate-200 rounded-lg p-1.5 hover:bg-slate-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                        />
                        <button
                            type="button"
                            onClick={() => setDate(shiftDateStr(date, 1))}
                            className="border border-slate-200 rounded-lg p-1.5 hover:bg-slate-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                        Hour slot
                    </label>
                    <select
                        value={slotKey || ''}
                        onChange={(e) => setSlotKey(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white min-w-[130px]"
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
                        <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                            Circle
                        </label>
                        <select
                            value={circleFilter}
                            onChange={(e) => setCircleFilter(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white min-w-[150px]"
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
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                        Columns
                    </label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    >
                        <option value="wzpdcl">WZPDCL only</option>
                        <option value="both">WZPDCL + PBS</option>
                    </select>
                </div>

                <div className="flex-1" />

                {editable && countdown && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full px-3 py-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Closes {countdown}
                    </span>
                )}

                {(isAdmin || editable) && (
                    <button
                        type="button"
                        onClick={saveAll}
                        disabled={savingAll || loading}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm"
                    >
                        {savingAll ? (
                            <Spinner className="w-4 h-4 text-white" />
                        ) : (
                            <SaveAll className="w-4 h-4" />
                        )}
                        Save all
                    </button>
                )}
            </div>

            {/* Table */}
            {loading && !form ? (
                <SkeletonTable rows={8} cols={7} />
            ) : !form ? (
                <p className="text-center text-slate-500 py-12">No form data</p>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th className="text-center w-12">SN</th>
                                    {multi && <th className="text-left">Circle</th>}
                                    <th className="text-left">Grid SS</th>
                                    <th className="text-right">Actual</th>
                                    <th className="text-right">Allotment</th>
                                    <th className="text-right">Loadshed</th>
                                    <th className="text-right">Demand</th>
                                    {showPbs && (
                                        <>
                                            <th className="text-right">PBS Load</th>
                                            <th className="text-right">PBS Allot</th>
                                            <th className="text-right">PBS LS</th>
                                        </>
                                    )}
                                    <th className="text-left">Note</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(form.rows || []).map((row, idx) => {
                                    const e = row.entry || {};
                                    const ro = !row.editable;
                                    const demand = n(e.actualLoad) + n(e.loadshed);
                                    return (
                                        <tr
                                            key={row.substationId}
                                            className={
                                                row._dirty
                                                    ? '!bg-amber-50/80'
                                                    : row.editable
                                                      ? ''
                                                      : ''
                                            }
                                        >
                                            <td className="text-center text-slate-500 tabular-nums">
                                                {idx + 1}
                                            </td>
                                            {multi && (
                                                <td className="whitespace-nowrap text-slate-600">
                                                    {row.circleName || '—'}
                                                </td>
                                            )}
                                            <td className="font-medium text-slate-800">
                                                {row.substationName}
                                                {row.isMine && (
                                                    <span className="ml-1 text-[10px] text-blue-600 font-semibold">
                                                        YOU
                                                    </span>
                                                )}
                                                {row._dirty && (
                                                    <span className="ml-1 text-[10px] text-amber-600">
                                                        unsaved
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-right">
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
                                            <td className="text-right">
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
                                            <td className="text-right">
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
                                            <td className="text-right tabular-nums text-slate-700 font-medium">
                                                {fmt(demand)}
                                            </td>
                                            {showPbs && (
                                                <>
                                                    <td className="text-right">
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
                                                    <td className="text-right">
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
                                                    <td className="text-right">
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
                                            <td>
                                                <input
                                                    type="text"
                                                    value={e.note || ''}
                                                    disabled={ro}
                                                    onChange={(ev) =>
                                                        updateLocal(row.substationId, {
                                                            note: ev.target.value,
                                                        })
                                                    }
                                                    className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs disabled:bg-slate-50"
                                                    placeholder="Note"
                                                />
                                            </td>
                                            <td className="text-center">
                                                {row.editable ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => saveRow(row)}
                                                        disabled={savingId === row.substationId}
                                                        className="inline-flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                                                    >
                                                        {savingId === row.substationId ? (
                                                            <Spinner className="w-3.5 h-3.5 text-white" />
                                                        ) : (
                                                            <Save className="w-3.5 h-3.5" />
                                                        )}
                                                        Save
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        {hasAnyValue(e) ? 'Saved' : '—'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td />
                                    {multi && <td>Total</td>}
                                    <td>{multi ? '' : 'Total'}</td>
                                    <td className="text-right tabular-nums">
                                        {fmt(stats.actual)}
                                    </td>
                                    <td className="text-right tabular-nums">
                                        {fmt(stats.allot)}
                                    </td>
                                    <td className="text-right tabular-nums">{fmt(stats.ls)}</td>
                                    <td className="text-right tabular-nums">
                                        {fmt(stats.demand)}
                                    </td>
                                    {showPbs && (
                                        <>
                                            <td className="text-right tabular-nums">
                                                {fmt(stats.pbs)}
                                            </td>
                                            <td colSpan={2} />
                                        </>
                                    )}
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            <p className="text-xs text-slate-500">
                ★ Peak slots <strong>17:30</strong> &amp; <strong>18:30</strong>. Single Save
                updates only that row (no page reload). Use <strong>Save all</strong> for the
                full table.
            </p>
        </div>
    );
}

function hasAnyValue(e) {
    if (!e) return false;
    return ['actualLoad', 'pgcbAllotment', 'loadshed', 'pbsLoad'].some(
        (k) => e[k] !== null && e[k] !== undefined && e[k] !== ''
    );
}

function recomputeTotals(rows) {
    return rows.reduce(
        (a, r) => {
            const e = r.entry || {};
            a.actualLoad += n(e.actualLoad);
            a.pgcbAllotment += n(e.pgcbAllotment);
            a.loadshed += n(e.loadshed);
            a.pbsLoad += n(e.pbsLoad);
            a.pbsAllotment += n(e.pbsAllotment);
            a.pbsLoadshed += n(e.pbsLoadshed);
            return a;
        },
        {
            actualLoad: 0,
            pgcbAllotment: 0,
            loadshed: 0,
            pbsLoad: 0,
            pbsAllotment: 0,
            pbsLoadshed: 0,
        }
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
            className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm disabled:bg-slate-50"
        />
    );
}

function Stat({ label, value, sub, tone = 'sky' }) {
    const tones = {
        sky: 'from-sky-500 to-blue-600',
        teal: 'from-teal-500 to-emerald-600',
        rose: 'from-rose-500 to-red-600',
        violet: 'from-violet-500 to-indigo-600',
        amber: 'from-amber-500 to-orange-600',
    };
    return (
        <div className="card overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${tones[tone]}`} />
            <div className="p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    {label}
                </div>
                <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                    {value}
                </div>
                {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}
