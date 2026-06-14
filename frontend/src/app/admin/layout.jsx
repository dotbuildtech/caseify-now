'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Boxes, Tag, Smartphone, Image, Link2, Layers, MessagesSquare, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUnreadCount } from '@/services/contactApi';

function MessagesNavItem() {
    const pathname = usePathname();
    const [unread, setUnread] = useState(0);
    const isActive = pathname.startsWith('/admin/messages');

    const poll = useCallback(async () => {
        try {
            const data = await getUnreadCount();
            setUnread(data.count || 0);
        } catch {}
    }, []);

    useEffect(() => {
        poll();
        const t = setInterval(poll, 30000);
        return () => clearInterval(t);
    }, [poll]);

    return (
        <Link href="/admin/messages"
            className={`flex items-center justify-between px-3 py-2 text-sm ${isActive ? 'font-medium text-ink' : 'text-text-light hover:bg-background-light'}`}
        >
            <span className="flex items-center gap-2"><MessagesSquare className="h-4 w-4" strokeWidth={1.5} /> Messages</span>
            <span className="flex items-center gap-1">
                {unread > 0 && (
                    <span className="flex items-center justify-center rounded-full bg-bronze px-1.5 py-0.5 text-[10px] font-semibold text-cream">
                        {unread}
                    </span>
                )}
                <ChevronRight className="h-3 w-3" />
            </span>
        </Link>
    );
}

const NAV = [
    { href: '/admin', label: 'Overview', Icon: LayoutDashboard, exact: true },
    { href: '/admin/products', label: 'Products', Icon: Package },
    { href: '/admin/orders', label: 'Orders', Icon: ShoppingBag },
    { href: '/admin/messages', label: 'Messages', Icon: MessagesSquare, badge: true },
    { href: '/admin/inventory', label: 'Inventory', Icon: Boxes },
    { href: '/admin/users', label: 'Users', Icon: Users },
    { href: '/admin/brands', label: 'Brands', Icon: Tag },
    { href: '/admin/models', label: 'Models', Icon: Smartphone },
    { href: '/admin/category-brands', label: 'Category Links', Icon: Link2 },
    { href: '/admin/materials', label: 'Materials', Icon: Layers },
    { href: '/admin/hero-slides', label: 'Hero Slides', Icon: Image },
    { href: '/admin/analytics', label: 'Analytics', Icon: BarChart3 }
];

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace('/login?redirect=/admin'); return; }
        if (user.role !== 'admin') { router.replace('/'); return; }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'admin') {
        return (
            <div className="container-luxe py-20">
                <div className="h-32 bg-background-light animate-pulse" />
            </div>
        );
    }

    const isActive = (item) => item.exact ? pathname === item.href : pathname.startsWith(item.href);

    return (
        <div className="container-luxe py-12 md:py-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <span className="eyebrow">— Control Room</span>
                    <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-5xl">
                        Admin <span className="italic-display">Dashboard</span>.
                    </h1>
                </div>
                <div className="flex items-center gap-2 border border-border bg-surface px-3 py-2">
                    <ShieldCheck className="h-4 w-4 text-bronze" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">{user.email}</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                <aside className="h-fit border border-border bg-surface">
                    <div className="border-b border-border p-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-text-light">Navigation</p>
                    </div>
                    <nav className="p-2">
                        {NAV.map((item) => {
                            if (item.badge) {
                                return (
                                    <div key={item.href} className={pathname.startsWith(item.href) ? 'border-l-2 border-ink bg-background-light' : ''}>
                                        <MessagesNavItem />
                                    </div>
                                );
                            }
                            const active = isActive(item);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center justify-between px-3 py-2 text-sm ${active ? 'border-l-2 border-ink bg-background-light font-medium text-ink' : 'text-text-light hover:bg-background-light'}`}
                                >
                                    <span className="flex items-center gap-2"><item.Icon className="h-4 w-4" strokeWidth={1.5} /> {item.label}</span>
                                    <ChevronRight className="h-3 w-3" />
                                </Link>
                            );
                        })}
                    </nav>
                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        className="flex w-full items-center gap-2 border-t border-border p-4 text-sm text-text-light hover:text-error"
                    >
                        <LogOut className="h-4 w-4" /> Logout
                    </button>
                </aside>

                <div className="min-w-0 space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
