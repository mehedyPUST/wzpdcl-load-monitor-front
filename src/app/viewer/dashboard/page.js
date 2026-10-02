'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import { Activity } from 'lucide-react';

export default function ViewerDashboard() {
    return (
        <Protected roles={['viewer']}>
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

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-wzpdcl-blue flex items-center gap-2 mb-4">
                <Activity className="w-6 h-6" /> Current Slot — {data.slotKey || 'N/A'}
            </h1>

            <div className="bg-white rounded-xl border border-wzpdcl-border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Circle</th>
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