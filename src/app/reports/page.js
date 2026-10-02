'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import { useAuth } from '@/lib/auth-context';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, Printer } from 'lucide-react';

export default function Reports() {
    return (
        <Protected roles={['admin', 'viewer', 'operator']}>
            <R />
        </Protected>
    );
}

function R() {
    const { user } = useAuth();
    const [circles, setCircles] = useState([]);
    const [scope, setScope] = useState('circle');
    const [id, setId] = useState('');
    const [period, setPeriod] = useState('daily');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [data, setData] = useState(null);

    useEffect(() => {
        if (user?.role === 'operator') {
            setScope('circle');
            setId(user.circleId);
        } else {
            api.get('/public/circles').then(r => setCircles(r.data.circles || []));
        }
    }, [user]);

    const load = async () => {
        if (!id) return;
        try {
            const r = await api.get(`/load/reports?scope=${scope}&id=${id}&period=${period}&date=${date}`);
            setData(r.data);
        } catch (e) { alert(e.message); }
    };

    const downloadCsv = () => {
        if (!data) return;
        const header = 'Key,Actual Load,PGCB Allotment,Loadshed,PBS Load\n';
        const body = data.series.map(s => `${s.key},${s.actualLoad},${s.pgcbAllotment},${s.loadshed},${s.pbsLoad}`).join('\n');
        const blob = new Blob([header + body], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report-${data.label}-${period}-${date}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-wzpdcl-blue mb-4">Reports</h1>

            <div className="no-print bg-white rounded-xl border border-wzpdcl-border p-4 mb-5 flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs text-slate-600 mb-1">Scope</label>
                    <select value={scope} onChange={e => setScope(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                        <option value="circle">Circle</option>
                        <option value="substation">Substation</option>
                    </select>
                </div>
                {user?.role !== 'operator' && scope === 'circle' && (
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Circle</label>
                        <select value={id} onChange={e => setId(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                            <option value="">Select</option>
                            {circles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-xs text-slate-600 mb-1">Period</label>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-600 mb-1">Anchor Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
                </div>
                <button onClick={load} className="bg-wzpdcl-blue text-white px-4 py-1.5 rounded text-sm">Load</button>
                {data && (
                    <>
                        <button onClick={downloadCsv} className="bg-wzpdcl-green text-white px-3 py-1.5 rounded text-sm inline-flex items-center gap-1">
                            <Download className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={() => window.print()} className="bg-slate-700 text-white px-3 py-1.5 rounded text-sm inline-flex items-center gap-1">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </>
                )}
            </div>

            {data && (
                <div className="bg-white rounded-xl border border-wzpdcl-border p-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">
                        {data.label} — {data.period} ({data.from} → {data.to})
                    </h2>
                    <ResponsiveContainer width="100%" height={360}>
                        <LineChart data={data.series}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="actualLoad" stroke="#003d7a" name="Actual Load" />
                            <Line type="monotone" dataKey="pgcbAllotment" stroke="#2e7d32" name="PGCB Allotment" />
                            <Line type="monotone" dataKey="loadshed" stroke="#c62828" name="Loadshed" />
                            <Line type="monotone" dataKey="pbsLoad" stroke="#f59e0b" name="PBS Load" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}