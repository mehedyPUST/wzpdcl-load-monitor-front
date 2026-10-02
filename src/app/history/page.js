'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Protected from '@/components/Protected';

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
            api.get('/public/circles').then(r => setCircles(r.data.circles || []));
        }
    }, [user]);

    const load = async () => {
        if (!circleId || !from || !to) return;
        setLoading(true);
        try {
            const res = await api.get(`/load/history?circleId=${circleId}&from=${from}&to=${to}`);
            setRows(res.data.rows || []);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (circleId) load(); /* eslint-disable-next-line */ }, [circleId]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-wzpdcl-blue mb-4">Hourly History</h1>

            <div className="bg-white rounded-xl border border-wzpdcl-border p-4 mb-4 flex flex-wrap items-end gap-3">
                {user?.role !== 'operator' && (
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Circle</label>
                        <select value={circleId} onChange={e => setCircleId(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                            <option value="">Select circle</option>
                            {circles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-xs text-slate-600 mb-1">From</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-slate-600 mb-1">To</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
                </div>
                <button onClick={load} className="bg-wzpdcl-blue text-white px-4 py-1.5 rounded text-sm">Load</button>
            </div>

            <div className="bg-white rounded-xl border border-wzpdcl-border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Slot</th>
                            <th className="text-right px-3 py-2">Actual Load</th>
                            <th className="text-right px-3 py-2">PGCB Allotment</th>
                            <th className="text-right px-3 py-2">Loadshed</th>
                            <th className="text-right px-3 py-2">PBS Load</th>
                            <th className="text-right px-3 py-2">Submitted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={6} className="text-center py-4 text-slate-500">Loading…</td></tr>}
                        {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-500">No data</td></tr>}
                        {rows.map(r => (
                            <tr key={r.slotKey} className="border-t">
                                <td className="px-3 py-2">{r.slotKey}</td>
                                <td className="px-3 py-2 text-right">{r.totals.actualLoad.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{r.totals.pgcbAllotment.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{r.totals.loadshed.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{r.totals.pbsLoad.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{r.submitted}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function today() {
    return new Date().toISOString().slice(0, 10);
}