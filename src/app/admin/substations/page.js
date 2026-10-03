'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import AdminSubNav from '@/components/AdminSubNav';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminSubstations() {
    return (
        <Protected roles={['admin']}>
            <Subs />
        </Protected>
    );
}

function Subs() {
    const [circles, setCircles] = useState([]);
    const [circleId, setCircleId] = useState('');
    const [subs, setSubs] = useState([]);
    const [name, setName] = useState('');
    const [district, setDistrict] = useState('');

    useEffect(() => {
        api.get('/admin/circles').then(r => {
            setCircles(r.data.circles || []);
            if (r.data.circles?.length) setCircleId(r.data.circles[0]._id);
        });
    }, []);

    const load = () => {
        if (!circleId) return;
        api.get(`/admin/substations?circleId=${circleId}`).then(r => setSubs(r.data.substations || []));
    };
    useEffect(load, [circleId]);

    const add = async () => {
        if (!name) return toast.error('Name required');
        try {
            await api.post('/admin/substations', { circleId, name, district });
            setName(''); setDistrict('');
            toast.success('Added');
            load();
        } catch (e) { toast.error(e.message); }
    };

    const remove = async (id) => {
        if (!confirm('Delete?')) return;
        try { await api.delete(`/admin/substations/${id}`); toast.success('Deleted'); load(); }
        catch (e) { toast.error(e.message); }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            
            <AdminSubNav />
            <h1 className="text-2xl font-bold text-wzpdcl-blue mb-4">Substations</h1>

            <div className="bg-white rounded-xl border p-4 mb-5 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-slate-600 mb-1">Circle</label>
                    <select value={circleId} onChange={e => setCircleId(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                        <option value="">Select</option>
                        {circles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-600 mb-1">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-slate-600 mb-1">District</label>
                    <input value={district} onChange={e => setDistrict(e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
                </div>
                <button onClick={add} className="bg-wzpdcl-green text-white px-4 py-1.5 rounded text-sm inline-flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            <div className="bg-white rounded-xl border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Name</th>
                            <th className="text-left px-3 py-2">District</th>
                            <th className="text-right px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subs.map(s => (
                            <tr key={s._id} className="border-t">
                                <td className="px-3 py-2">{s.name}</td>
                                <td className="px-3 py-2 text-slate-600">{s.district}</td>
                                <td className="px-3 py-2 text-right">
                                    <button onClick={() => remove(s._id)} className="text-wzpdcl-red text-xs inline-flex items-center gap-1">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}