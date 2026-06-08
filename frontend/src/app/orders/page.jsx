'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchMyOrders } from '@/services/orderApi';
import { formatINR, formatDate } from '@/utils/format';

const STATUS_COLORS = {
    Ordered: 'border-yellow-300 text-yellow-800 bg-yellow-50',
    Processing: 'border-blue-300 text-blue-800 bg-blue-50',
    Shipped: 'border-blue-300 text-blue-800 bg-blue-50',
    Delivered: 'border-green-300 text-green-800 bg-green-50',
    Cancelled: 'border-red-300 text-red-800 bg-red-50',
    pending: 'border-yellow-300 text-yellow-800 bg-yellow-50',
    paid: 'border-green-300 text-green-800 bg-green-50',
    delivered: 'border-green-300 text-green-800 bg-green-50'
};

const STATUS_STEPS = ['Ordered', 'Processing', 'Shipped', 'Delivered'];

const StatusBadge = ({ status }) => {
    const color = STATUS_COLORS[status] || 'border-border text-text-light bg-background-light';
    return (
        <span className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${color}`}>
            {status}
        </span>
    );
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        let mounted = true;
        fetchMyOrders()
            .then((d) => { if (mounted) setOrders(Array.isArray(d) ? d : []); })
            .catch(() => { if (mounted) setOrders([]); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const filtered = orders.filter((o) => {
        if (filter === 'all') return true;
        return (o.orderStatus || o.status || 'Ordered').toLowerCase() === filter;
    });

    return (
        <div className="container-luxe py-12 md:py-20">
            <div className="mb-10">
                <span className="eyebrow">— Your Orders</span>
                <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-editorial md:text-6xl">
                    My <span className="italic-display">Orders</span>.
                </h1>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {['all', 'ordered', 'shipped', 'delivered', 'cancelled'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors ${filter === f ? 'border-ink bg-ink text-cream' : 'border-border hover:border-ink'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-background-light animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="border border-dashed border-border bg-surface p-12 text-center">
                    <h2 className="font-display text-2xl">No orders found.</h2>
                    <Link href="/shop" className="btn-primary mt-6">Start Shopping</Link>
                </div>
            ) : (
                <ul className="space-y-3">
                    {filtered.map((o) => {
                        const id = o.id || o._id;
                        const status = o.orderStatus || o.status || 'Ordered';
                        const stepIdx = STATUS_STEPS.indexOf(status);
                        return (
                            <li key={id} className="border border-border bg-surface p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Order ID</p>
                                        <p className="mt-1 font-mono text-sm">#{id}</p>
                                        <p className="mt-2 text-xs text-text-light">{formatDate(o.createdAt)} · {o.items?.length || 0} item(s)</p>
                                    </div>
                                    <div className="text-right">
                                        <StatusBadge status={status} />
                                        <p className="mt-2 font-display text-xl font-semibold tabular-nums">{formatINR(o.totalPrice)}</p>
                                    </div>
                                </div>
                                {stepIdx >= 0 && (
                                    <div className="mt-4 flex items-center gap-1">
                                        {STATUS_STEPS.map((_, i) => (
                                            <div key={i} className={`h-1 flex-1 ${i <= stepIdx ? 'bg-ink' : 'bg-border'}`} />
                                        ))}
                                    </div>
                                )}
                                <div className="mt-4 flex gap-2">
                                    <Link href={`/order-confirmation/${id}`} className="btn-ghost">View Details</Link>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
