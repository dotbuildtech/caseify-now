'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Boxes, Tag, Smartphone, Image, Link2, Layers, MessagesSquare, ChevronRight, LogOut, ShieldCheck, SlidersHorizontal, Menu, X } from 'lucide-react';
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
    { href: '/admin/custom-designs', label: 'Custom Designs', Icon: Layers },
    { href: '/admin/inventory', label: 'Inventory', Icon: Boxes },
    { href: '/admin/users', label: 'Users', Icon: Users },
    { href: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
    { href: '/admin/messages', label: 'Messages', Icon: MessagesSquare, badge: true },
    { href: '/admin/brands', label: 'Brands', Icon: Tag },
    { href: '/admin/models', label: 'Models', Icon: Smartphone },
    { href: '/admin/materials', label: 'Materials', Icon: Layers },
    { href: '/admin/category-brands', label: 'Category Links', Icon: Link2 },
    { href: '/admin/filter-options', label: 'Filter Options', Icon: SlidersHorizontal },
    { href: '/admin/hero-slides', label: 'Hero Slides', Icon: Image },
];

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

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

    const sidebarContent = (
        <>
            <div className="flex items-center justify-between border-b border-border p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-text-light">Navigation</p>
                <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 rounded hover:bg-accent">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
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
                            prefetch={false}
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
                className="flex w-full items-center gap-2 border-t border-border p-4 text-sm text-text-light hover:text-error shrink-0"
            >
                <LogOut className="h-4 w-4" /> Logout
            </button>
        </>
    );

    return (
        <div className="min-h-screen">
            {/* Mobile top bar */}
            <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 py-3">
                <button onClick={() => setMobileOpen(true)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent">
                    <Menu className="h-5 w-5" />
                </button>
                <span className="text-sm font-semibold tracking-tight">Admin</span>
                <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-bronze" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium text-text-light truncate max-w-[120px]">{user.email}</span>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <div className="relative w-64 h-full bg-surface border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left">
                        {sidebarContent}
                    </div>
                </div>
            )}

            <div className="container-luxe py-8 md:py-12">
                {/* Desktop header */}
                <div className="hidden md:flex flex-wrap items-end justify-between gap-4 mb-8">
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
                    {/* Desktop sidebar - sticky, full height, scrollable */}
                    <aside className="hidden md:flex flex-col sticky top-4 max-h-[calc(100vh-2rem)] border border-border bg-surface">
                        {sidebarContent}
                    </aside>

                    <div className="min-w-0 space-y-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
