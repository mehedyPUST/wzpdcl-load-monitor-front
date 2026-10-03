'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LOGO_URL, APP_NAME } from '@/lib/brand';
import {
    LogOut,
    LayoutDashboard,
    FileText,
    Users,
    Building2,
    History,
    Zap,
    Settings as SettingsIcon,
} from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const navLinks = {
        admin: [
            { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/admin/circles', label: 'Circles', icon: Building2 },
            { href: '/admin/substations', label: 'Substations', icon: Zap },
            { href: '/admin/users', label: 'Users', icon: Users },
            { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
            { href: '/history', label: 'History', icon: History },
            { href: '/reports', label: 'Reports', icon: FileText },
        ],
        operator: [
            { href: '/input', label: 'Hourly Input', icon: Zap },
            { href: '/history', label: 'History', icon: History },
        ],
        viewer: [
            { href: '/viewer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/reports', label: 'Reports', icon: FileText },
        ],
    };

    const links = user ? navLinks[user.role] || [] : [];

    return (
        <header className="no-print bg-wzpdcl-blue text-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2.5">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-3 font-bold text-lg">
                    <div className="bg-white rounded-md p-1 flex items-center justify-center w-11 h-11">
                        <img src={LOGO_URL} alt="WZPDCL" className="w-9 h-9 object-contain" />
                    </div>
                    <span className="hidden sm:inline">{APP_NAME}</span>
                </Link>

                {/* Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {links.map((l) => {
                        const Icon = l.icon;
                        const active = pathname.startsWith(l.href);
                        return (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition ${active ? 'bg-white/20' : 'hover:bg-white/10'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {l.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <span className="hidden sm:block text-sm opacity-90">
                                {user.name}
                                {user.role === 'operator' && user.substationName && (
                                    <span className="opacity-75"> · {user.substationName}</span>
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