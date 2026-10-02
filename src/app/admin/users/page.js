'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import toast from 'react-hot-toast';
import { Plus, Trash2, KeyRound } from 'lucide-react';

export default function AdminUsers() {
    return (
        <Protected roles={['admin']}>
            <Users />
        </Protected>
    );
}

function Users() {
    const [users, setUsers] = useState([]);
    const [circles, setCircles] = useState([]);
    const [subs, setSubs] = useState([]);

    const [form, setForm] = useState({
        role: 'operator', name: '', email: '', password: '',
        circleId: '', substationId: '', viewerCircles: [],
    });

    const load = () => api.get('/users').then(r => setUsers(r.data.users || []));
    useEffect(() => {
        load();
        api.get('/admin/circles').then(r => setCircles(r.data.circles || []));
    }, []);

    useEffect(() => {
        if (form.circleId) {
            api.get(`/admin/substations?circleId=${form.circleId}`).then(r => setSubs(r.data.substations || []));
        } else setSubs([]);
    }, [form.circleId]);

    const submit = async () => {
        try {
            const payload = { ...form };
            if (payload.role !== 'operator') { delete payload.circleId; delete payload.substationId; }
            if (payload.role !== 'viewer') { delete payload.viewerCircles; }
            await api.post('/users', payload);
            toast.success('Created');
            setForm({ role: 'operator', name: '', email: '', password: '', circleId: '', substationId: '', viewerCircles: [] });
            load();
        } catch (e) { toast.error(e.message); }
    };

    const remove = async (id) => {
        if (!confirm('Delete user?')) return;
        try { await api.delete(`/users/${id}`); toast.success('Deleted'); load(); }
        catch (e) { toast.error(e.message); }
    };

    const resetPwd = async (id) => {
        const np = prompt('New password:');
        if (!np) return;
        try { await api.patch(`/users/${id}/password`, { password: np }); toast.success('Password updated'); }
        catch (e) { toast.error(e.message); }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-wzpdcl-blue mb-4">Users</h1>

            <div className="bg-white rounded-xl border border-wzpdcl-border p-4 mb-5 grid grid-cols-1 md:grid-cols-6 gap-3">
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="border rounded px-2 py-1.5 text-sm">
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                </select>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border rounded px-2 py-1.5 text-sm" />
                {form.role !== 'operator' && (
                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded px-2 py-1.5 text-sm" />
                )}
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="border rounded px-2 py-1.5 text-sm" />

                {form.role === 'operator' && (
                    <>
                        <select value={form.circleId} onChange={e => setForm({ ...form, circleId: e.target.value, substationId: '' })} className="border rounded px-2 py-1.5 text-sm">
                            <option value="">Circle…</option>
                            {circles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <select value={form.substationId} onChange={e => setForm({ ...form, substationId: e.target.value })} className="border rounded px-2 py-1.5 text-sm">
                            <option value="">Substation…</option>
                            {subs.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </>
                )}

                <button onClick={submit} className="bg-wzpdcl-green text-white px-4 py-1.5 rounded text-sm flex items-center justify-center gap-1 md:col-span-2">
                    <Plus className="w-4 h-4" /> Create User
                </button>
            </div>

            <div className="bg-white rounded-xl border border-wzpdcl-border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Name</th>
                            <th className="text-left px-3 py-2">Role</th>
                            <th className="text-left px-3 py-2">Email</th>
                            <th className="text-right px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} className="border-t">
                                <td className="px-3 py-2">{u.name}</td>
                                <td className="px-3 py-2 capitalize">{u.role}</td>
                                <td className="px-3 py-2 text-slate-600">{u.email || '—'}</td>
                                <td className="px-3 py-2 text-right space-x-2">
                                    <button onClick={() => resetPwd(u._id)} className="text-wzpdcl-blue hover:underline text-xs inline-flex items-center gap-1">
                                        <KeyRound className="w-3.5 h-3.5" /> Reset
                                    </button>
                                    <button onClick={() => remove(u._id)} className="text-wzpdcl-red hover:underline text-xs inline-flex items-center gap-1">
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