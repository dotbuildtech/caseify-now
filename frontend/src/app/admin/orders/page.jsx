'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Package, ExternalLink, FileText } from 'lucide-react';
import { adminListOrders, adminUpdateOrderStatus, adminGetInvoiceByOrder, adminGenerateInvoice, adminDownloadInvoice } from '@/services/adminApi';
import { formatINR, formatDate } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

const STATUSES = ['Ordered', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLOR = {
    Delivered: 'border-green-300 text-green-800 bg-green-50',
    Shipped: 'border-blue-300 text-blue-800 bg-blue-50',
    Processing: 'border-blue-300 text-blue-800 bg-blue-50',
    Ordered: 'border-yellow-300 text-yellow-800 bg-yellow-50',
    Cancelled: 'border-red-300 text-red-800 bg-red-50'
};

const StatusBadge = ({ status }) => (
    <span className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${STATUS_COLOR[status] || 'border-border text-text-light'}`}>
        {status}
    </span>
);

export default function AdminOrdersPage() {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [q, setQ] = useState('');
    const [updating, setUpdating] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(null);
    const [invoices, setInvoices] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const d = await adminListOrders();
            setOrders(Array.isArray(d) ? d : []);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const updateStatus = async (order, status) => {
        if (status === (order.orderStatus || order.status)) return;
        setUpdating(order.id);
        try {
            await adminUpdateOrderStatus(order.id, status);
            setOrders((arr) => arr.map((o) => o.id === order.id ? { ...o, orderStatus: status, isDelivered: status === 'Delivered' } : o));
            toast.success(`Marked as ${status}`);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(null);
        }
    };

    const invoiceAction = async (order) => {
        setInvoiceLoading(order.id);
        try {
            let invoice = invoices[order.id];
            if (!invoice) {
                try {
                    invoice = await adminGetInvoiceByOrder(order.id);
                } catch {
                    const payload = { orderId: order.id };
                    invoice = await adminGenerateInvoice(payload);
                }
                setInvoices((prev) => ({ ...prev, [order.id]: invoice }));
            }
            const blob = await adminDownloadInvoice(invoice.id);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Invoice action failed');
        } finally {
            setInvoiceLoading(null);
        }
    };

    const filtered = orders.filter((o) => {
        const status = o.orderStatus || o.status || 'Ordered';
        if (filter !== 'All' && status !== filter) return false;
        if (q.trim()) {
            const needle = q.trim().toLowerCase();
            const hay = `${o.id} ${o.User?.name || ''} ${o.User?.email || ''}`.toLowerCase();
            if (!hay.includes(needle)) return false;
        }
        return true;
    });

    const counts = STATUSES.reduce((acc, s) => {
        acc[s] = orders.filter((o) => (o.orderStatus || o.status) === s).length;
        return acc;
    }, { All: orders.length });

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Orders</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${filtered.length} of ${orders.length}`}</p>
                </div>
                <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink">
                    <Search className="h-4 w-4 text-text-light" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search id, customer…"
                        className="w-64 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-text-light"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {['All', ...STATUSES].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors ${filter === s ? 'border-ink bg-ink text-cream' : 'border-border hover:border-ink'}`}
                    >
                        {s} <span className={`ml-1 ${filter === s ? 'text-cream/70' : 'text-text-light'}`}>{counts[s] ?? 0}</span>
                    </button>
                ))}
            </div>

            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-background-light animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">No orders match.</div>
                ) : (
                    <ul className="divide-y divide-border">
                        {filtered.map((o) => {
                            const status = o.orderStatus || o.status || 'Ordered';
                            const isOpen = expanded === o.id;
                            return (
                                <li key={o.id} className="p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            onClick={() => setExpanded(isOpen ? null : o.id)}
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        >
                                            <ChevronDown className={`h-4 w-4 shrink-0 text-text-light transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                            <div className="min-w-0">
                                                <p className="font-mono text-xs text-text-light">#{o.id}</p>
                                                <p className="mt-0.5 truncate text-sm font-medium">{o.User?.name || 'Guest'} <span className="text-text-light">· {o.User?.email || ''}</span></p>
                                                <p className="mt-0.5 text-xs text-text-light">{formatDate(o.createdAt)} · {o.items?.length || 0} item(s) · {o.paymentMethod || '—'}</p>
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-3">
                                            <p className="font-display text-base font-semibold tabular-nums">{formatINR(o.totalPrice)}</p>
                                            <StatusBadge status={status} />
                                            <select
                                                value={status}
                                                onChange={(e) => updateStatus(o, e.target.value)}
                                                disabled={updating === o.id}
                                                className="border border-border bg-surface px-2 py-1.5 text-xs uppercase tracking-[0.18em] outline-none focus:border-ink disabled:opacity-50"
                                            >
                                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Items</p>
                                                <ul className="mt-2 divide-y divide-border border border-border">
                                                    {(o.items || []).map((it) => (
                                                        <li key={it.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                                                            <span className="truncate">{it.name} <span className="text-text-light">× {it.qty}</span></span>
                                                            <span className="font-display tabular-nums">{formatINR(Number(it.price) * Number(it.qty))}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Shipping address</p>
                                                    <p className="mt-1 text-xs">
                                                        {[o.shippingAddress?.address, o.shippingAddress?.city, o.shippingAddress?.state, o.shippingAddress?.postalCode, o.shippingAddress?.country].filter(Boolean).join(', ') || '—'}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div className="border border-border p-2">
                                                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">Items</p>
                                                        <p className="font-display tabular-nums">{formatINR(o.itemsPrice)}</p>
                                                    </div>
                                                    <div className="border border-border p-2">
                                                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">Tax</p>
                                                        <p className="font-display tabular-nums">{formatINR(o.taxPrice)}</p>
                                                    </div>
                                                    <div className="border border-border p-2">
                                                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">Ship</p>
                                                        <p className="font-display tabular-nums">{formatINR(o.shippingPrice)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 text-xs">
                                                    <span className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${o.isPaid ? 'border-green-300 text-green-800 bg-green-50' : 'border-yellow-300 text-yellow-800 bg-yellow-50'}`}>
                                                        {o.isPaid ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                    <button
                                                        onClick={() => invoiceAction(o)}
                                                        disabled={invoiceLoading === o.id}
                                                        className="inline-flex items-center gap-1 text-text-light hover:text-bronze disabled:opacity-50"
                                                    >
                                                        <FileText className="h-3 w-3" /> {invoiceLoading === o.id ? 'Generating…' : 'Invoice'}
                                                    </button>
                                                    <Link href={`/order-confirmation/${o.id}`} target="_blank" className="inline-flex items-center gap-1 text-text-light hover:text-bronze">
                                                        Customer view <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );
}
