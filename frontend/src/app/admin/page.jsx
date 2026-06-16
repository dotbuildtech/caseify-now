'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, Users, Wallet, TrendingUp, AlertTriangle, ArrowUpRight, BarChart3 } from 'lucide-react';
import { adminGetDashboard } from '@/services/adminApi';
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

function KPITiles({ dash, customers, lowStockCount }) {
    const tiles = useMemo(() => {
        const o = dash?.overview || {};
        const revThis = o.revenueThisMonth ?? 0;
        return [
            { label: 'Revenue (30d)', value: formatINR(revThis), sub: 'Current month revenue', Icon: TrendingUp },
            { label: 'Ordered (30d)', value: formatINR(revThis), sub: 'Total order amount', Icon: Wallet },
            { label: 'Orders (total)', value: o.totalOrders ?? 0, sub: `${o.pendingInvoices ?? 0} invoices pending`, Icon: ShoppingBag },
            { label: 'Products', value: o.totalProducts ?? 0, sub: `${lowStockCount} low stock`, Icon: Package },
            { label: 'Customers', value: customers?.totalUsers ?? o.totalCustomers ?? 0, sub: `${customers?.retentionRate || '—'} retention`, Icon: Users }
        ];
    }, [dash, customers, lowStockCount]);

    return (
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
    );
}

function RecentOrders({ orders }) {
    if (!orders?.length) {
        return <div className="p-8 text-center text-sm text-text-light">No orders yet.</div>;
    }
    return (
        <ul className="divide-y divide-border">
            {orders.map((o) => {
                const status = o.orderStatus || 'Ordered';
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
    );
}

function LowStockPanel({ products }) {
    if (!products?.length) {
        return <div className="p-8 text-center text-sm text-text-light">All products are well stocked.</div>;
    }
    return (
        <ul className="divide-y divide-border">
            {products.map((p) => (
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
    );
}

function KPISkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border border-border bg-surface p-4">
                    <div className="h-5 w-5 animate-pulse bg-background-light" />
                    <div className="mt-3 h-8 w-24 animate-pulse bg-background-light" />
                    <div className="mt-1 h-3 w-20 animate-pulse bg-background-light" />
                </div>
            ))}
        </div>
    );
}

function PanelSkeleton() {
    return (
        <div className="border border-border bg-surface">
            <div className="border-b border-border p-4">
                <div className="h-6 w-32 animate-pulse bg-background-light" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                        <div className="h-3 w-16 animate-pulse bg-background-light" />
                        <div className="h-3 w-40 animate-pulse bg-background-light" />
                    </div>
                    <div className="h-6 w-20 animate-pulse bg-background-light" />
                </div>
            ))}
        </div>
    );
}

export default function AdminOverviewPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const d = await adminGetDashboard();
                if (!mounted) return;
                setData(d);
            } catch (e) {
                if (mounted) setErr(e.message || 'Failed to load dashboard');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    if (err) {
        return (
            <div className="border border-error bg-surface p-6">
                <p className="text-sm text-error">{err}</p>
            </div>
        );
    }

    return (
        <>
            {loading ? <KPISkeleton /> : <KPITiles dash={data} customers={data?.customerAnalytics} lowStockCount={data?.lowStock?.length ?? 0} />}

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <h2 className="font-display text-xl">Recent orders</h2>
                        <Link href="/admin/orders" className="flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-light hover:text-bronze">
                            Manage <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {loading ? <PanelSkeleton /> : <RecentOrders orders={data?.recentOrders} />}
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
                    {loading ? <PanelSkeleton /> : <LowStockPanel products={data?.lowStock} />}
                </div>
            </div>

            {!loading && (
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
            )}
        </>
    );
}
