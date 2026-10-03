'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import AdminSubNav from '@/components/AdminSubNav';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';

const SUGGESTED = [
    'Khulna',
    'Kushtia',
    'Jashore',
    'Barishal',
    'Patuakhali',
    'Faridpur',
];

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
    const [busy, setBusy] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDistricts, setEditDistricts] = useState('');

    const load = async () => {
        try {
            const r = await api.get('/admin/circles');
            setCircles(r.data.circles || []);
        } catch (e) {
            toast.error(e.message || 'Failed to load circles');
        }
    };

    useEffect(() => {
        load();
    }, []);

    const parseDistricts = (str) =>
        String(str || '')
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean);

    const add = async () => {
        const n = name.trim();
        if (!n) return toast.error('Circle name is required');
        setBusy(true);
        try {
            await api.post('/admin/circles', {
                name: n,
                districts: parseDistricts(districts),
            });
            toast.success('Circle created');
            setName('');
            setDistricts('');
            load();
        } catch (e) {
            toast.error(e.message || 'Failed to create circle');
        } finally {
            setBusy(false);
        }
    };

    const startEdit = (c) => {
        setEditId(c._id);
        setEditName(c.name || '');
        setEditDistricts((c.districts || []).join(', '));
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditName('');
        setEditDistricts('');
    };

    const saveEdit = async () => {
        if (!editName.trim()) return toast.error('Name required');
        setBusy(true);
        try {
            await api.patch(`/admin/circles/${editId}`, {
                name: editName.trim(),
                districts: parseDistricts(editDistricts),
            });
            toast.success('Circle updated');
            cancelEdit();
            load();
        } catch (e) {
            toast.error(e.message || 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this circle? (Only if it has no substations)')) return;
        try {
            await api.delete(`/admin/circles/${id}`);
            toast.success('Deleted');
            load();
        } catch (e) {
            toast.error(e.message || 'Delete failed');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            
            <AdminSubNav />
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Circles</h1>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Add circle</h2>
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">
                            Circle name *
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            list="suggested-circles"
                            className="border rounded px-2 py-1.5 text-sm min-w-[180px]"
                            placeholder="e.g. Khulna"
                        />
                        <datalist id="suggested-circles">
                            {SUGGESTED.map((s) => (
                                <option key={s} value={s} />
                            ))}
                        </datalist>
                    </div>
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-xs text-slate-600 mb-1">
                            Districts (comma-separated)
                        </label>
                        <input
                            value={districts}
                            onChange={(e) => setDistricts(e.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-sm"
                            placeholder="Khulna, Bagerhat, Satkhira"
                        />
                    </div>
                    <button
                        onClick={add}
                        disabled={busy}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        {busy ? 'Saving…' : 'Add'}
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Suggested: {SUGGESTED.join(', ')}
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Name</th>
                            <th className="text-left px-3 py-2">Districts</th>
                            <th className="text-right px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {circles.map((c) => (
                            <tr key={c._id} className="border-t">
                                {editId === c._id ? (
                                    <>
                                        <td className="px-3 py-2">
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="border rounded px-2 py-1 text-sm w-full"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                value={editDistricts}
                                                onChange={(e) => setEditDistricts(e.target.value)}
                                                className="border rounded px-2 py-1 text-sm w-full"
                                                placeholder="District1, District2"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right space-x-2">
                                            <button
                                                onClick={saveEdit}
                                                className="text-emerald-600 hover:underline text-xs inline-flex items-center gap-1"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="text-slate-500 hover:underline text-xs inline-flex items-center gap-1"
                                            >
                                                <X className="w-3.5 h-3.5" /> Cancel
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2 font-medium">{c.name}</td>
                                        <td className="px-3 py-2 text-slate-600">
                                            {(c.districts || []).join(', ') || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right space-x-2">
                                            <button
                                                onClick={() => startEdit(c)}
                                                className="text-blue-700 hover:underline text-xs inline-flex items-center gap-1"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button
                                                onClick={() => remove(c._id)}
                                                className="text-red-600 hover:underline text-xs inline-flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {circles.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center py-6 text-slate-500">
                                    No circles yet — add one above
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
