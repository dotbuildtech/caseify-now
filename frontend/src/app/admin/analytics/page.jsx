'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, Users as UsersIcon, IndianRupee, ShoppingCart } from 'lucide-react';
import { adminSalesAnalytics, adminCustomerAnalytics, adminRevenueAnalytics, adminProfitLoss } from '@/services/adminApi';
import { formatINR, formatDate } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

export default function AdminAnalyticsPage() {
    const toast = useToast();
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState(null);
    const [revenue, setRevenue] = useState(null);
    const [pnl, setPnl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [s, c, r, p] = await Promise.allSettled([
                    adminSalesAnalytics(),
                    adminCustomerAnalytics(),
                    adminRevenueAnalytics(),
                    adminProfitLoss()
                ]);
                if (!mounted) return;
                if (s.status === 'fulfilled') setSales(Array.isArray(s.value) ? s.value : []);
                if (c.status === 'fulfilled') setCustomers(c.value);
                if (r.status === 'fulfilled') setRevenue(r.value);
                if (p.status === 'fulfilled') setPnl(p.value);
            } catch (e) {
                toast.error('Failed to load analytics');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const tiles = [
        { label: 'Revenue (30d)', value: formatINR(revenue?.summary?.totalRevenue ?? 0), Icon: IndianRupee },
        { label: 'Orders (30d)', value: revenue?.summary?.orderCount ?? 0, Icon: ShoppingCart },
        { label: 'Avg order value', value: formatINR(revenue?.summary?.avgOrderValue ?? 0), Icon: TrendingUp },
        { label: 'Customers', value: customers?.totalUsers ?? 0, Icon: UsersIcon }
    ];

    const maxDaily = Math.max(1, ...((revenue?.daily || []).map((d) => Number(d.revenue) || 0)));

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-background-light animate-pulse" />)}
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {tiles.map(({ label, value, Icon }) => (
                    <div key={label} className="border border-border bg-surface p-4">
                        <Icon className="h-5 w-5 text-ink" strokeWidth={1.25} />
                        <p className="mt-3 font-display text-2xl tabular-nums">{value}</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="border border-border bg-surface">
                    <div className="border-b border-border p-4">
                        <h2 className="font-display text-xl">Daily revenue (last 30d)</h2>
                    </div>
                    {revenue?.daily?.length ? (
                        <div className="p-4">
                            <div className="flex h-40 items-end gap-1">
                                {revenue.daily.map((d) => {
                                    const h = (Number(d.revenue) / maxDaily) * 100;
                                    return (
                                        <div key={d.date} title={`${d.date} · ${formatINR(d.revenue)}`} className="flex-1 bg-ink/80 transition-colors hover:bg-bronze" style={{ height: `${Math.max(2, h)}%` }} />
                                    );
                                })}
                            </div>
                            <div className="mt-2 flex justify-between text-[10px] text-text-light">
                                <span>{revenue.daily[0]?.date}</span>
                                <span>{revenue.daily[revenue.daily.length - 1]?.date}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-sm text-text-light">No revenue in this period.</div>
                    )}
                </div>

                <div className="border border-border bg-surface">
                    <div className="border-b border-border p-4">
                        <h2 className="font-display text-xl">Top products</h2>
                    </div>
                    {sales.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-light">No sales yet.</div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {sales.map((s, i) => (
                                <li key={s.ProductId} className="flex items-center justify-between gap-3 p-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink font-mono text-xs text-cream">{i + 1}</span>
                                        <span className="truncate text-sm">{s.Product?.name || `#${s.ProductId}`}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-display text-sm font-semibold tabular-nums">{formatINR(s.revenue)}</p>
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">{s.totalSold} units</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {pnl && (
                <div className="border border-border bg-surface">
                    <div className="border-b border-border p-4">
                        <h2 className="font-display text-xl">Ordered Amount (last 30d)</h2>
                    </div>
                    <div className="grid gap-4 p-4 md:grid-cols-2">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">Total Ordered</p>
                            <p className="font-display text-xl tabular-nums">{formatINR(pnl.revenue?.grossRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">Total Orders</p>
                            <p className="font-display text-xl tabular-nums">{pnl.revenue?.orderCount ?? 0}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
