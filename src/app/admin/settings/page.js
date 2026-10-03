'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import AdminSubNav from '@/components/AdminSubNav';
import toast from 'react-hot-toast';
import { Save, Plus, X, Clock } from 'lucide-react';

export default function AdminSettings() {
    return (
        <Protected roles={['admin']}>
            <Settings />
        </Protected>
    );
}

const ALL_TIMES = (() => {
    const out = [];
    for (let h = 0; h < 24; h++) out.push(`${String(h).padStart(2, '0')}:00`);
    out.push('18:30');
    out.push('19:30');
    out.sort();
    return out;
})();

function Settings() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSlot, setNewSlot] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/admin/settings/always-open-slots');
                setSlots(res.data.slots || []);
            } catch (e) {
                toast.error(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const add = (s) => {
        const v = (s || newSlot).trim();
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(v)) {
            toast.error('Format must be HH:MM (e.g. 08:00)');
            return;
        }
        if (slots.includes(v)) {
            toast.error('Already added');
            return;
        }
        setSlots([...slots, v].sort());
        setNewSlot('');
    };

    const remove = (s) => setSlots(slots.filter((x) => x !== s));

    const save = async () => {
        setSaving(true);
        try {
            const res = await api.put('/admin/settings/always-open-slots', { slots });
            setSlots(res.data.slots || []);
            toast.success('Settings saved');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        setSlots(['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00']);
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading…</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            
            <AdminSubNav />
            <h1 className="text-2xl font-bold text-wzpdcl-blue mb-2 flex items-center gap-2">
                <Clock className="w-6 h-6" /> Admin Settings
            </h1>
            <p className="text-sm text-slate-500 mb-6">
                Configure which time-of-day slots operators are always allowed to edit,
                regardless of the current time.
            </p>

            <div className="bg-white rounded-xl border border-wzpdcl-border p-5">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">
                    Always-Open Slots (Operators)
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                    These slots can be entered by operators at any time — even outside their normal 5-minute
                    window. Useful for early-morning backfill (e.g. 00:00 – 08:00).
                </p>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 mb-4 min-h-[42px]">
                    {slots.length === 0 && (
                        <span className="text-sm text-slate-400 italic">No always-open slots</span>
                    )}
                    {slots.map((s) => (
                        <span
                            key={s}
                            className="inline-flex items-center gap-1 bg-wzpdcl-blue text-white text-sm px-3 py-1 rounded-full"
                        >
                            {s}
                            <button
                                onClick={() => remove(s)}
                                className="hover:bg-white/20 rounded-full p-0.5"
                                title="Remove"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>

                {/* Add */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                    <input
                        type="text"
                        placeholder="HH:MM (e.g. 08:00)"
                        value={newSlot}
                        onChange={(e) => setNewSlot(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && add()}
                        className="border border-wzpdcl-border rounded-md px-3 py-2 text-sm w-40"
                    />
                    <button
                        onClick={() => add()}
                        className="inline-flex items-center gap-1 bg-slate-700 text-white px-3 py-2 rounded-md text-sm hover:bg-slate-800"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                    <span className="text-xs text-slate-500 ml-2">or quick-add:</span>
                    {['00:00', '04:00', '08:00', '12:00'].map((t) => (
                        <button
                            key={t}
                            onClick={() => add(t)}
                            disabled={slots.includes(t)}
                            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
                        >
                            + {t}
                        </button>
                    ))}
                </div>

                {/* Save row */}
                <div className="flex items-center gap-2 pt-4 border-t border-wzpdcl-border">
                    <button
                        onClick={save}
                        disabled={saving}
                        className="inline-flex items-center gap-1 bg-wzpdcl-green text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 disabled:opacity-60"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Settings'}
                    </button>
                    <button
                        onClick={reset}
                        className="text-sm text-slate-600 hover:underline px-3"
                    >
                        Reset to 00:00–08:00
                    </button>
                </div>
            </div>

            {/* Quick preset for all 26 slots — useful for testing */}
            <div className="mt-6 bg-white rounded-xl border border-wzpdcl-border p-5">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">Quick presets</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() =>
                            setSlots(
                                ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00']
                            )
                        }
                        className="text-xs px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200"
                    >
                        Morning (00:00 – 08:00)
                    </button>
                    <button
                        onClick={() => setSlots(ALL_TIMES.slice())}
                        className="text-xs px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200"
                    >
                        All 26 slots open
                    </button>
                    <button
                        onClick={() => setSlots([])}
                        className="text-xs px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200"
                    >
                        None (strict only)
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                    After picking, click <strong>Save Settings</strong> above to persist.
                </p>
            </div>
        </div>
    );
}