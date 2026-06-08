'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, Users, Wallet, TrendingUp, AlertTriangle, ArrowUpRight, BarChart3 } from 'lucide-react';
import { adminFinancialDashboard, adminListOrders, adminLowStockProducts, adminCustomerAnalytics } from '@/services/adminApi';
import { formatINR, formatDate } from '@/utils/format';

const StatusBadge = ({ status }) => {
    const map = {
        Delivered: 'border-green-300 text-green-800 bg-green-50',
        Shipped: 'border-blue-300 text-blue-800 bg-blue-50',
        Processing: 'border-blue-300 text-blue-800 bg-blue-50',
        Ordered: 'border-yellow-300 text-yellow-800 bg-yellow-50',
        Cancelled: 'border-red-300 text-red-800 bg-red-50'
    };
    return <span className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${map[status] || 'border-border text-text-light'}`}>{status}</span>;
};

export default function AdminOverviewPage() {
    const [dash, setDash] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [customers, setCustomers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [d, orders, low, cust] = await Promise.allSettled([
                    adminFinancialDashboard(),
                    adminListOrders(),
                    adminLowStockProducts(),
                    adminCustomerAnalytics()
                ]);
                if (!mounted) return;
                if (d.status === 'fulfilled') setDash(d.value);
                if (orders.status === 'fulfilled') setRecentOrders((Array.isArray(orders.value) ? orders.value : []).slice(0, 6));
                if (low.status === 'fulfilled') setLowStock((low.value?.data || []).slice(0, 6));
                if (cust.status === 'fulfilled') setCustomers(cust.value);
            } catch (e) {
                if (mounted) setErr(e.message);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-background-light animate-pulse" />)}
            </div>
        );
    }

    if (err) {
        return (
            <div className="border border-error bg-surface p-6">
                <p className="text-sm text-error">{err}</p>
            </div>
        );
    }

    const revThis = dash?.revenue?.thisMonth ?? 0;
    const revChange = dash?.revenue?.changePercent ?? 0;
    const tiles = [
        { label: 'Revenue (30d)', value: formatINR(revThis), sub: `${revChange >= 0 ? '+' : ''}${Number(revChange).toFixed(1)}% vs prev`, Icon: TrendingUp },
        { label: 'Ordered (30d)', value: formatINR(revThis), sub: 'Total order amount', Icon: Wallet },
        { label: 'Orders (total)', value: dash?.orders?.total ?? 0, sub: `${dash?.invoices?.pending ?? 0} invoices pending`, Icon: ShoppingBag },
        { label: 'Products', value: dash?.products?.total ?? 0, sub: `${lowStock.length} low stock`, Icon: Package },
        { label: 'Customers', value: customers?.totalUsers ?? dash?.customers?.total ?? 0, sub: `${customers?.retentionRate || '—'} retention`, Icon: Users }
    ];

    return (
        <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {tiles.map(({ label, value, sub, Icon }) => (
                    <div key={label} className="border border-border bg-surface p-4">
                        <Icon className="h-5 w-5 text-ink" strokeWidth={1.25} />
                        <p className="mt-3 font-display text-2xl tabular-nums">{value}</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">{label}</p>
                        <p className="mt-1 text-[11px] text-text-light">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <h2 className="font-display text-xl">Recent orders</h2>
                        <Link href="/admin/orders" className="flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze">
                            Manage <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-light">No orders yet.</div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {recentOrders.map((o) => {
                                const status = o.orderStatus || o.status || 'Ordered';
                                return (
                                    <li key={o.id} className="flex items-center justify-between gap-3 p-4">
                                        <div className="min-w-0">
                                            <p className="font-mono text-xs text-text-light">#{o.id}</p>
                                            <p className="mt-1 truncate text-xs text-text-light">{o.User?.name || 'Guest'} · {formatDate(o.createdAt)}</p>
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
                        <h2 className="flex items-center gap-2 font-display text-xl">
                            <AlertTriangle className="h-4 w-4 text-bronze" strokeWidth={1.5} /> Low stock
                        </h2>
                        <Link href="/admin/products?lowStock=1" className="flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze">
                            View all <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {lowStock.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-light">All products are well stocked.</div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {lowStock.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <Link href={`/admin/products/${p.id}`} className="block truncate text-sm font-medium hover:text-bronze">{p.name}</Link>
                                        <p className="mt-0.5 text-xs text-text-light">{p.category || '—'} · SKU {p.sku || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-display text-lg font-semibold tabular-nums text-error">{p.stock}</p>
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">threshold {p.lowStockThreshold}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <Link href="/admin/products/new" className="border border-border bg-surface p-5 transition-colors hover:border-ink">
                    <Package className="h-5 w-5 text-ink" strokeWidth={1.25} />
                    <h3 className="mt-3 font-display text-lg">Add product</h3>
                    <p className="mt-1 text-xs text-text-light">Create a new SKU</p>
                </Link>
                <Link href="/admin/orders" className="border border-border bg-surface p-5 transition-colors hover:border-ink">
                    <ShoppingBag className="h-5 w-5 text-ink" strokeWidth={1.25} />
                    <h3 className="mt-3 font-display text-lg">Process orders</h3>
                    <p className="mt-1 text-xs text-text-light">Update status & fulfilment</p>
                </Link>
                <Link href="/admin/analytics" className="border border-border bg-surface p-5 transition-colors hover:border-ink">
                    <BarChart3 className="h-5 w-5 text-ink" strokeWidth={1.25} />
                    <h3 className="mt-3 font-display text-lg">Analytics</h3>
                    <p className="mt-1 text-xs text-text-light">Top products & revenue</p>
                </Link>
            </div>
        </>
    );
}
