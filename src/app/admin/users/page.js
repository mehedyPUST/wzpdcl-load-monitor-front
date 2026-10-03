'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Protected from '@/components/Protected';
import AdminSubNav from '@/components/AdminSubNav';
import toast from 'react-hot-toast';
import { Plus, Trash2, KeyRound } from 'lucide-react';

function roleLabel(role) {
    if (role === 'operator') return 'SBA';
    if (role === 'admin') return 'Admin';
    if (role === 'viewer') return 'Viewer';
    return role;
}

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
    const [busy, setBusy] = useState(false);

    const emptyForm = {
        role: 'operator',
        name: '',
        email: '',
        password: '',
        circleId: '',
        substationId: '',
        viewerCircles: [],
    };
    const [form, setForm] = useState(emptyForm);

    const load = async () => {
        try {
            const r = await api.get('/users');
            setUsers(r.data.users || []);
        } catch (e) {
            toast.error(e.message || 'Failed to load users');
        }
    };

    useEffect(() => {
        load();
        api.get('/admin/circles')
            .then((r) => setCircles(r.data.circles || []))
            .catch((e) => toast.error(e.message || 'Failed to load circles'));
    }, []);

    useEffect(() => {
        if (form.circleId) {
            api.get(`/admin/substations?circleId=${form.circleId}`)
                .then((r) => setSubs(r.data.substations || []))
                .catch(() => setSubs([]));
        } else {
            setSubs([]);
        }
    }, [form.circleId]);

    const submit = async () => {
        if (!form.name.trim()) return toast.error('Name is required');
        if (!form.password || form.password.length < 4) {
            return toast.error('Password must be at least 4 characters');
        }
        if (form.role === 'admin' || form.role === 'viewer') {
            if (!form.email.trim()) return toast.error('Email is required for Admin/Viewer');
        }
        if (form.role === 'operator') {
            if (!form.circleId || !form.substationId) {
                return toast.error('Circle and Substation are required for SBA');
            }
        }

        setBusy(true);
        try {
            const payload = {
                role: form.role,
                name: form.name.trim(),
                password: form.password,
            };
            if (form.role === 'admin' || form.role === 'viewer') {
                payload.email = form.email.trim();
            }
            if (form.role === 'operator') {
                payload.circleId = form.circleId;
                payload.substationId = form.substationId;
            }
            if (form.role === 'viewer') {
                payload.viewerCircles = form.viewerCircles || [];
            }

            await api.post('/users', payload);
            toast.success(`${roleLabel(form.role)} created`);
            setForm(emptyForm);
            load();
        } catch (e) {
            toast.error(e.message || 'Create failed');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            toast.success('Deleted');
            load();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const resetPwd = async (id) => {
        const np = prompt('New password (min 4 characters):');
        if (!np) return;
        if (np.length < 4) return toast.error('Password too short');
        try {
            await api.patch(`/users/${id}/password`, { password: np });
            toast.success('Password updated');
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            
            <AdminSubNav />
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Users</h1>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Create user</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <select
                        value={form.role}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                role: e.target.value,
                                circleId: '',
                                substationId: '',
                                email: '',
                            })
                        }
                        className="border rounded px-2 py-1.5 text-sm"
                    >
                        <option value="operator">SBA</option>
                        <option value="viewer">Viewer</option>
                        <option value="admin">Admin</option>
                    </select>

                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Full name"
                        className="border rounded px-2 py-1.5 text-sm"
                    />

                    {(form.role === 'admin' || form.role === 'viewer') && (
                        <input
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="Email"
                            type="email"
                            className="border rounded px-2 py-1.5 text-sm"
                        />
                    )}

                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Password"
                        className="border rounded px-2 py-1.5 text-sm"
                    />

                    {form.role === 'operator' && (
                        <>
                            <select
                                value={form.circleId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        circleId: e.target.value,
                                        substationId: '',
                                    })
                                }
                                className="border rounded px-2 py-1.5 text-sm"
                            >
                                <option value="">Circle…</option>
                                {circles.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={form.substationId}
                                onChange={(e) =>
                                    setForm({ ...form, substationId: e.target.value })
                                }
                                className="border rounded px-2 py-1.5 text-sm"
                            >
                                <option value="">Substation…</option>
                                {subs.map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <button
                        onClick={submit}
                        disabled={busy}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm flex items-center justify-center gap-1 md:col-span-1"
                    >
                        <Plus className="w-4 h-4" />
                        {busy ? 'Saving…' : 'Create'}
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    SBA = Substation operator (needs Circle + Grid SS). Admin/Viewer need email.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="text-left px-3 py-2">Name</th>
                            <th className="text-left px-3 py-2">Role</th>
                            <th className="text-left px-3 py-2">Email</th>
                            <th className="text-left px-3 py-2">Active</th>
                            <th className="text-right px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id} className="border-t">
                                <td className="px-3 py-2 font-medium">{u.name}</td>
                                <td className="px-3 py-2">
                                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100">
                                        {roleLabel(u.role)}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-slate-600">{u.email || '—'}</td>
                                <td className="px-3 py-2">
                                    {u.active === false ? (
                                        <span className="text-red-600">No</span>
                                    ) : (
                                        <span className="text-emerald-600">Yes</span>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-right space-x-2">
                                    <button
                                        onClick={() => resetPwd(u._id)}
                                        className="text-blue-700 hover:underline text-xs inline-flex items-center gap-1"
                                    >
                                        <KeyRound className="w-3.5 h-3.5" /> Password
                                    </button>
                                    <button
                                        onClick={() => remove(u._id)}
                                        className="text-red-600 hover:underline text-xs inline-flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-slate-500">
                                    No users yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
