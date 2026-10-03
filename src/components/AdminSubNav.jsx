'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Zap, Users, Settings, LayoutGrid } from 'lucide-react';

const LINKS = [
    { href: '/admin/manage', label: 'Overview', icon: LayoutGrid },
    { href: '/admin/circles', label: 'Circles', icon: Building2 },
    { href: '/admin/substations', label: 'Substations', icon: Zap },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSubNav() {
    const pathname = usePathname();
    return (
        <div className="no-print mb-5 overflow-x-auto">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
                {LINKS.map((l) => {
                    const Icon = l.icon;
                    const active =
                        l.href === '/admin/manage'
                            ? pathname === '/admin/manage'
                            : pathname.startsWith(l.href);
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                                active
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {l.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
