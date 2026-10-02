'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import { Zap, Activity } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <Protected roles={['admin']}>
            <Dash />
        </Protected>
    );
}

function Dash() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = () => api.get('/load/current-status').then(r => setData(r.data));
        load();
        const t = setInterval(load, 60000);
        return () => clearInterval(t);
    }, []);

    if (!data) return <div className="p-10 text-center text-slate-500">Loading…</div>;

    const grand = data.circles.reduce((a, c) => {
        a.actualLoad += c.totals.actualLoad;
        a.pgcbAllotment += c.totals.pgcbAllotment;
        a.loadshed += c.totals.loadshed;
        a.pbsLoad += c.totals.pbsLoad;
        return a;
    }, { actualLoad: 0, pgcbAllotment: 0, loadshed: 0, pbsLoad: 0 });

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-wzpdcl-blue flex items-center gap-2 mb-4">
                <Activity className="w-6 h-6" /> Live Status — {data.slotKey || 'no active slot'}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Stat title="Total Actual Load" value={grand.actualLoad} unit="MW" color="bg-wzpdcl-blue" />
                <Stat title="PGCB Allotment" value={grand.pgcbAllotment} unit="MW" color="bg-wzpdcl-green" />
                <Stat title="Total Loadshed" value={grand.loadshed} unit="MW" color="bg-wzpdcl-red" />
                <Stat title="Total PBS Load" value={grand.pbsLoad} unit="MW" color="bg-slate-700" />
            </div>

            <div className="bg-white rounded-xl border border-wzpdcl-border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Circle</th>
                            <th className="text-right px-3 py-2">Submitted</th>
                            <th className="text-right px-3 py-2">Actual Load</th>
                            <th className="text-right px-3 py-2">PGCB</th>
                            <th className="text-right px-3 py-2">Loadshed</th>
                            <th className="text-right px-3 py-2">PBS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.circles.map(c => (
                            <tr key={c.circleId} className="border-t">
                                <td className="px-3 py-2 font-medium">{c.circleName}</td>
                                <td className="px-3 py-2 text-right">{c.submitted}/{c.totalSubstations}</td>
                                <td className="px-3 py-2 text-right">{c.totals.actualLoad.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{c.totals.pgcbAllotment.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{c.totals.loadshed.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{c.totals.pbsLoad.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Stat({ title, value, unit, color }) {
    return (
        <div className={`${color} text-white rounded-xl p-4 shadow`}>
            <div className="text-xs uppercase opacity-90">{title}</div>
            <div className="text-2xl font-bold mt-1">{value.toFixed(2)} <span className="text-sm font-normal">{unit}</span></div>
        </div>
    );
}