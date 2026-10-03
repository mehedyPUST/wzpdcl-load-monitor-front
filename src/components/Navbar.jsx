'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LOGO_URL, APP_NAME } from '@/lib/brand';
import {
    LogOut,
    LayoutDashboard,
    FileText,
    History,
    Zap,
    Home,
    Shield,
} from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const navLinks = {
        admin: [
            { href: '/', label: 'Home', icon: Home },
            { href: '/admin/dashboard', label: 'Monitor', icon: LayoutDashboard },
            { href: '/input', label: 'Input', icon: Zap },
            { href: '/admin/manage', label: 'Admin actions', icon: Shield },
            { href: '/history', label: 'History', icon: History },
            { href: '/reports', label: 'Reports', icon: FileText },
        ],
        operator: [
            { href: '/', label: 'Home', icon: Home },
            { href: '/input', label: 'Hourly Input', icon: Zap },
            { href: '/history', label: 'History', icon: History },
        ],
        viewer: [
            { href: '/', label: 'Home', icon: Home },
            { href: '/viewer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/reports', label: 'Reports', icon: FileText },
        ],
    };

    const links = user ? navLinks[user.role] || [] : [];

    const roleLabel =
        user?.role === 'operator'
            ? 'SBA'
            : user?.role === 'admin'
              ? 'Admin'
              : user?.role === 'viewer'
                ? 'Viewer'
                : '';

    const isActive = (href) => {
        if (href === '/') return pathname === '/';
        if (href === '/admin/manage') {
            return (
                pathname.startsWith('/admin/manage') ||
                pathname.startsWith('/admin/circles') ||
                pathname.startsWith('/admin/substations') ||
                pathname.startsWith('/admin/users') ||
                pathname.startsWith('/admin/settings')
            );
        }
        return pathname.startsWith(href);
    };

    return (
        <header className="no-print bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-white/5">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2.5">
                <Link href="/" className="flex items-center gap-3 font-bold text-lg">
                    <div className="bg-white rounded-md p-1 flex items-center justify-center w-11 h-11">
                        <img
                            src={LOGO_URL}
                            alt="WZPDCL"
                            className="w-9 h-9 object-contain"
                        />
                    </div>
                    <span className="hidden sm:inline">{APP_NAME}</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {links.map((l) => {
                        const Icon = l.icon;
                        const active = isActive(l.href);
                        return (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition ${
                                    active ? 'bg-white/20' : 'hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {l.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <span className="hidden sm:block text-sm opacity-90">
                                {user.name}
                                {roleLabel && (
                                    <span className="opacity-70"> · {roleLabel}</span>
                                )}
                                {user.role === 'operator' && user.substationName && (
                                    <span className="opacity-75">
                                        {' '}
                                        · {user.substationName}
                                    </span>
                                )}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-sm transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-white text-wzpdcl-blue px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
