'use client';

import Link from 'next/link';
import Protected from '@/components/Protected';
import {
    Building2,
    Zap,
    Users,
    Settings,
    ChevronRight,
    Shield,
} from 'lucide-react';

const ACTIONS = [
    {
        href: '/admin/circles',
        title: 'Circles',
        desc: 'Add, edit or remove distribution circles and their districts.',
        icon: Building2,
        tone: 'from-blue-600 to-sky-500',
    },
    {
        href: '/admin/substations',
        title: 'Substations',
        desc: 'Manage grid substations under each circle (Grid SS list).',
        icon: Zap,
        tone: 'from-amber-500 to-orange-500',
    },
    {
        href: '/admin/users',
        title: 'Users',
        desc: 'Create SBA, Viewer and Admin accounts; reset passwords.',
        icon: Users,
        tone: 'from-emerald-600 to-teal-500',
    },
    {
        href: '/admin/settings',
        title: 'Settings',
        desc: 'System options such as always-open slots for data entry.',
        icon: Settings,
        tone: 'from-slate-700 to-slate-500',
    },
];

export default function AdminManagePage() {
    return (
        <Protected roles={['admin']}>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-3">
                        <Shield className="w-3.5 h-3.5" />
                        Admin only
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                        Admin actions
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">
                        Manage circles, substations, users and system settings from one place.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    {ACTIONS.map((a) => {
                        const Icon = a.icon;
                        return (
                            <Link
                                key={a.href}
                                href={a.href}
                                className="group card p-5 hover:shadow-md hover:border-blue-200/80 transition flex gap-4 items-start"
                            >
                                <div
                                    className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${a.tone} text-white flex items-center justify-center shadow-sm`}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h2 className="font-semibold text-slate-900 group-hover:text-blue-800">
                                            {a.title}
                                        </h2>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        {a.desc}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </Protected>
    );
}
