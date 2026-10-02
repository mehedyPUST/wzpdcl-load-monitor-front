'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function AdminCircles() {
    return (
        <Protected roles={['admin']}>
            <Circles />
        </Protected>
    );
}

function Circles() {
    const [circles, setCircles] = useState([]);
    const [name, setName] = useState('');
    const [districts, setDistricts] = useState('');

    const load = () => api.get('/admin/circles').then(r => setCircles(r.data.circles || []));
    useEffect(() => { load(); }, []);

    const add = async () => {
        if (!name) return toast.error('Name required');
        try {
            await api.post('/admin/circles', {
                name,
                districts: districts.split(',').map(s => s.trim()).filter(Boolean),
            });
            setName(''); setDistricts('');
            toast.success('Added');
            load();
        } catch (e) { toast.error(e.message); }
    };

    const remove = async (id) => {
        if (!confirm('Delete circle?')) return;
        try { await api.delete(`/admin/circles/${id}`); toast.success('Deleted'); load(); }
        catch (e) { toast.error(e.message); }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-wzpdcl-blue mb-4">Circles</h1>

            <div className="bg-white rounded-xl border border-wzpdcl-border p-4 mb-5 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-slate-600 mb-1">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="border rounded px-2 py-1.5 text-sm" placeholder="Khulna" />
                </div>
                <div className="flex-1 min-w-[240px]">
                    <label className="block text-xs text-slate-600 mb-1">Districts (comma-separated)</label>
                    <input value={districts} onChange={e => setDistricts(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Khulna, Bagerhat" />
                </div>
                <button onClick={add} className="bg-wzpdcl-green text-white px-4 py-1.5 rounded text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            <div className="bg-white rounded-xl border border-wzpdcl-border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Name</th>
                            <th className="text-left px-3 py-2">Districts</th>
                            <th className="text-right px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {circles.map(c => (
                            <tr key={c._id} className="border-t">
                                <td className="px-3 py-2 font-medium">{c.name}</td>
                                <td className="px-3 py-2 text-slate-600">{(c.districts || []).join(', ')}</td>
                                <td className="px-3 py-2 text-right">
                                    <button onClick={() => remove(c._id)} className="text-wzpdcl-red hover:underline text-xs inline-flex items-center gap-1">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {circles.length === 0 && (
                            <tr><td colSpan={3} className="text-center py-4 text-slate-500">No circles yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}