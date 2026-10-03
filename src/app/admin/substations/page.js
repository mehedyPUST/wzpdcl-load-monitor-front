'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import AdminSubNav from '@/components/AdminSubNav';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';

export default function AdminSubstations() {
    return (
        <Protected roles={['admin']}>
            <Subs />
        </Protected>
    );
}

function Subs() {
    const [circles, setCircles] = useState([]);
    const [filterCircleId, setFilterCircleId] = useState(''); // table filter
    const [subs, setSubs] = useState([]);
    const [busy, setBusy] = useState(false);

    // create form
    const [circleId, setCircleId] = useState('');
    const [name, setName] = useState('');
    const [district, setDistrict] = useState('');
    const [zone, setZone] = useState('');

    // edit
    const [editId, setEditId] = useState(null);
    const [edit, setEdit] = useState({
        name: '',
        district: '',
        zone: '',
        circleId: '',
    });

    useEffect(() => {
        api.get('/admin/circles')
            .then((r) => {
                const list = r.data.circles || [];
                setCircles(list);
                if (list.length && !circleId) setCircleId(list[0]._id);
            })
            .catch((e) => toast.error(e.message || 'Failed to load circles'));
    }, []);

    const load = async (cid) => {
        try {
            const q = cid ? `?circleId=${cid}` : '';
            const r = await api.get(`/admin/substations${q}`);
            setSubs(r.data.substations || []);
        } catch (e) {
            toast.error(e.message || 'Failed to load substations');
        }
    };

    useEffect(() => {
        load(filterCircleId);
    }, [filterCircleId]);

    const add = async () => {
        if (!circleId) return toast.error('Select circle');
        if (!name.trim()) return toast.error('Name required');
        setBusy(true);
        try {
            await api.post('/admin/substations', {
                circleId,
                name: name.trim(),
                district: district.trim(),
                zone: zone.trim(),
            });
            toast.success('Substation added');
            setName('');
            setDistrict('');
            setZone('');
            load(filterCircleId);
        } catch (e) {
            toast.error(e.message || 'Add failed');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this substation?')) return;
        try {
            await api.delete(`/admin/substations/${id}`);
            toast.success('Deleted');
            load(filterCircleId);
        } catch (e) {
            toast.error(e.message || 'Delete failed');
        }
    };

    const startEdit = (s) => {
        setEditId(s._id);
        setEdit({
            name: s.name || '',
            district: s.district || '',
            zone: s.zone || '',
            circleId: s.circleId?.toString?.() || s.circleId || '',
        });
    };

    const cancelEdit = () => {
        setEditId(null);
    };

    const saveEdit = async () => {
        if (!edit.name.trim()) return toast.error('Name required');
        setBusy(true);
        try {
            await api.patch(`/admin/substations/${editId}`, {
                name: edit.name.trim(),
                district: edit.district.trim(),
                zone: edit.zone.trim(),
                circleId: edit.circleId || undefined,
            });
            toast.success('Updated');
            setEditId(null);
            load(filterCircleId);
        } catch (e) {
            toast.error(e.message || 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <AdminSubNav />

            <h1 className="text-2xl font-bold text-slate-800 mb-4">Substations</h1>

            {/* Add form */}
            <div className="card p-4 mb-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Add substation</h2>
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">
                            Circle name *
                        </label>
                        <select
                            value={circleId}
                            onChange={(e) => setCircleId(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm min-w-[160px] bg-white"
                        >
                            <option value="">Select circle</option>
                            {circles.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">
                            Grid SS name *
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm min-w-[160px]"
                            placeholder="e.g. Bottail"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">District</label>
                        <input
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm min-w-[140px]"
                            placeholder="District"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Zone</label>
                        <input
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm min-w-[140px]"
                            placeholder="Zone"
                        />
                    </div>
                    <button
                        onClick={add}
                        disabled={busy}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm inline-flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
                <label className="text-xs text-slate-500">Show:</label>
                <select
                    value={filterCircleId}
                    onChange={(e) => setFilterCircleId(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                >
                    <option value="">All circles</option>
                    {circles.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <span className="text-xs text-slate-400">{subs.length} substation(s)</span>
            </div>

            {/* Table */}
            <div className="card overflow-x-auto">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th className="text-center w-12">SN</th>
                            <th className="text-left">Circle name</th>
                            <th className="text-left">Grid SS</th>
                            <th className="text-left">District</th>
                            <th className="text-left">Zone</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subs.map((s, i) =>
                            editId === s._id ? (
                                <tr key={s._id} className="!bg-amber-50/50">
                                    <td className="text-center text-slate-500">{i + 1}</td>
                                    <td>
                                        <select
                                            value={edit.circleId}
                                            onChange={(e) =>
                                                setEdit({ ...edit, circleId: e.target.value })
                                            }
                                            className="border rounded px-2 py-1 text-sm w-full bg-white"
                                        >
                                            {circles.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            value={edit.name}
                                            onChange={(e) =>
                                                setEdit({ ...edit, name: e.target.value })
                                            }
                                            className="border rounded px-2 py-1 text-sm w-full"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={edit.district}
                                            onChange={(e) =>
                                                setEdit({ ...edit, district: e.target.value })
                                            }
                                            className="border rounded px-2 py-1 text-sm w-full"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={edit.zone}
                                            onChange={(e) =>
                                                setEdit({ ...edit, zone: e.target.value })
                                            }
                                            className="border rounded px-2 py-1 text-sm w-full"
                                        />
                                    </td>
                                    <td className="text-right space-x-2 whitespace-nowrap">
                                        <button
                                            onClick={saveEdit}
                                            className="text-emerald-700 hover:underline text-xs inline-flex items-center gap-1"
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
                                </tr>
                            ) : (
                                <tr key={s._id}>
                                    <td className="text-center text-slate-500 tabular-nums">
                                        {i + 1}
                                    </td>
                                    <td className="font-medium text-slate-800">
                                        {s.circleName || '—'}
                                    </td>
                                    <td>{s.name}</td>
                                    <td className="text-slate-600">{s.district || '—'}</td>
                                    <td className="text-slate-600">{s.zone || '—'}</td>
                                    <td className="text-right space-x-2 whitespace-nowrap">
                                        <button
                                            onClick={() => startEdit(s)}
                                            className="text-blue-700 hover:underline text-xs inline-flex items-center gap-1"
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => remove(s._id)}
                                            className="text-red-600 hover:underline text-xs inline-flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </td>
                                </tr>
                            )
                        )}
                        {subs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-slate-500">
                                    No substations yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
