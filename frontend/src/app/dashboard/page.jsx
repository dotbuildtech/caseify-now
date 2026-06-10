'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Package, Heart, MapPin, Layers, Sparkles, ChevronRight, Trash2, ShoppingBag, Edit3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchProfile } from '@/services/authApi';
import { fetchMyOrders } from '@/services/orderApi';
import { formatINR, formatDate } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';

const SAVED_KEY = 'dotbuild_saved_designs';

const StatusBadge = ({ status }) => {
    const colorMap = {
        Delivered: 'border-green-300 text-green-800 bg-green-50',
        Shipped: 'border-blue-300 text-blue-800 bg-blue-50',
        Processing: 'border-blue-300 text-blue-800 bg-blue-50',
        Ordered: 'border-yellow-300 text-yellow-800 bg-yellow-50',
        Cancelled: 'border-red-300 text-red-800 bg-red-50'
    };
    const c = colorMap[status] || 'border-border text-text-light';
    return <span className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${c}`}>{status}</span>;
};

export default function DashboardPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { user: ctxUser, loading: authLoading, logout } = useAuth();
    const toast = useToast();
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [designs, setDesigns] = useState([]);

    useEffect(() => {
        if (authLoading) return;
        if (!ctxUser) { router.push('/login?redirect=/dashboard'); return; }
        let mounted = true;
        fetchProfile()
            .then((d) => { if (mounted) setProfile(d?.data || d || ctxUser); })
            .catch(() => { if (mounted) setProfile(ctxUser); });
        fetchMyOrders()
            .then((d) => { if (mounted) setOrders(Array.isArray(d) ? d.slice(0, 5) : []); })
            .catch(() => { if (mounted) setOrders([]); });
        try {
            const raw = localStorage.getItem(SAVED_KEY);
            if (mounted) setDesigns(raw ? JSON.parse(raw).slice(0, 6) : []);
        } catch { if (mounted) setDesigns([]); }
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctxUser, authLoading]);

    const deleteDesign = (id) => {
        const next = designs.filter((d) => d.id !== id);
        setDesigns(next);
        try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
        toast.success('Design deleted');
    };

    if (!profile) return <div className="container-luxe py-20"><div className="h-32 bg-background-light animate-pulse" /></div>;

    const totalSpend = orders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const stats = [
        { label: 'Total orders', value: orders.length, Icon: Package },
        { label: 'Total spent', value: formatINR(totalSpend), Icon: ShoppingBag },
        { label: 'Saved designs', value: designs.length, Icon: Layers },
        { label: 'Loyalty points', value: Math.floor(totalSpend / 100), Icon: Sparkles }
    ];

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mb-10">
                <span className="eyebrow">— Welcome back</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    Hello, <span className="italic-display">{profile.name?.split(' ')[0]}</span>.
                </h1>
            </div>

            <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                <aside className="h-fit border border-border bg-surface">
                    <div className="flex items-center gap-3 border-b border-border p-4">
                        <div className="flex h-12 w-12 items-center justify-center bg-ink text-cream">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{profile.name}</p>
                            <p className="truncate text-xs text-text-light">{profile.email}</p>
                        </div>
                    </div>
                    <nav className="p-2">
                        {[
                            { href: '/dashboard', label: 'Overview', Icon: Layers },
                            { href: '/orders', label: 'Orders', Icon: Package },
                            { href: '/customize', label: 'Design Studio', Icon: Edit3 },
                            { href: '/my-account', label: 'Profile', Icon: User }
                        ].map((item) => {
                            const active = item.href === pathname;
                            return (
                            <Link key={item.href} href={item.href} className={`flex items-center justify-between px-3 py-2 text-sm ${active ? 'border-l-2 border-ink bg-background-light font-medium' : 'text-text-light hover:bg-background-light'}`}>
                                <span className="flex items-center gap-2"><item.Icon className="h-4 w-4" /> {item.label}</span>
                                <ChevronRight className="h-3 w-3" />
                            </Link>
                            );
                        })}
                    </nav>
                    <button onClick={async () => { await logout(); router.push('/'); }} className="flex w-full items-center gap-2 border-t border-border p-4 text-sm text-text-light hover:text-error">
                        <User className="h-4 w-4" /> Logout
                    </button>
                </aside>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {stats.map(({ label, value, Icon }) => (
                            <div key={label} className="border border-border bg-surface p-4">
                                <Icon className="h-5 w-5 text-ink" strokeWidth={1.25} />
                                <p className="mt-3 font-display text-2xl">{value}</p>
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">{label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border border-border bg-surface">
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <h2 className="font-display text-xl">Recent orders</h2>
                            <Link href="/orders" className="text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze">View all</Link>
                        </div>
                        {orders.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-text-light">No orders yet.</p>
                                <Link href="/shop" className="btn-primary mt-3">Start shopping</Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {orders.map((o) => {
                                    const id = o.id || o._id;
                                    const status = o.orderStatus || o.status || 'Ordered';
                                    return (
                                        <li key={id} className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-mono text-xs text-text-light">#{id}</p>
                                                <p className="mt-1 text-xs text-text-light">{formatDate(o.createdAt)} · {o.items?.length || 0} item(s)</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <StatusBadge status={status} />
                                                <p className="font-display text-base font-semibold tabular-nums">{formatINR(o.totalPrice)}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="border border-border bg-surface">
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <h2 className="font-display text-xl">Saved designs</h2>
                            <Link href="/customize" className="text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze">Open studio</Link>
                        </div>
                        {designs.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-text-light">No saved designs yet.</p>
                                <Link href="/customize" className="btn-primary mt-3">Create one</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
                                {designs.map((d) => (
                                    <div key={d.id} className="group relative aspect-[3/4] overflow-hidden border border-border bg-background-light">
                                        {d.thumbnail ? (
                                            <SmartImage src={d.thumbnail} alt="Design" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-2xl">🎨</div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-2 text-cream">
                                            <p className="text-[10px]">{formatDate(d.createdAt)}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteDesign(d.id)}
                                            className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center bg-cream text-error shadow group-hover:flex"
                                            aria-label="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <Link href="/customize" className="border border-border bg-surface p-5 transition-colors hover:border-ink">
                            <Edit3 className="h-5 w-5 text-ink" strokeWidth={1.25} />
                            <h3 className="mt-3 font-display text-lg">Create new design</h3>
                            <p className="mt-1 text-xs text-text-light">Open the AI-powered studio</p>
                        </Link>
                        <Link href="/track" className="border border-border bg-surface p-5 transition-colors hover:border-ink">
                            <MapPin className="h-5 w-5 text-ink" strokeWidth={1.25} />
                            <h3 className="mt-3 font-display text-lg">Track an order</h3>
                            <p className="mt-1 text-xs text-text-light">Real-time status lookup</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
