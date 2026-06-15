'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ExternalLink, FileText, X, User, Package, MapPin, CreditCard, ImageIcon, Palette, Layers } from 'lucide-react';
import { adminListOrders, adminUpdateOrderStatus, adminGetInvoiceByOrder, adminGenerateInvoice, adminDownloadInvoice } from '@/services/adminApi';
import { formatINR, formatDate } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';

const STATUSES = ['Ordered', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLOR = {
    Delivered: 'border-green-300 text-green-800 bg-green-50',
    Shipped: 'border-blue-300 text-blue-800 bg-blue-50',
    Processing: 'border-blue-300 text-blue-800 bg-blue-50',
    Ordered: 'border-yellow-300 text-yellow-800 bg-yellow-50',
    Cancelled: 'border-red-300 text-red-800 bg-red-50'
};

const PAYMENT_COLOR = {
    true: 'border-green-300 text-green-800 bg-green-50',
    false: 'border-yellow-300 text-yellow-800 bg-yellow-50'
};

const StatusBadge = ({ status }) => (
    <span className={`inline-block border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${STATUS_COLOR[status] || 'border-border text-text-light'}`}>
        {status}
    </span>
);

const SectionHeading = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-text-light" />}
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-light">{title}</p>
    </div>
);

const ImagePreviewModal = ({ src, alt, onClose }) => {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    return (
        <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
            <div className="relative max-h-[90vh] max-w-[90vw]">
                <button onClick={onClose} className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 shadow-lg hover:bg-stone-100">
                    <X className="h-4 w-4" />
                </button>
                <img src={src} alt={alt} className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl" />
            </div>
        </div>
    );
};

const ProductImage = ({ src, alt }) => {
    const [open, setOpen] = useState(false);
    if (!src) return (
        <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center bg-background-light text-text-light">
            <Package className="h-8 w-8" />
        </div>
    );
    return (
        <>
            <button onClick={() => setOpen(true)} className="group relative h-28 w-28 flex-shrink-0 overflow-hidden bg-background-light cursor-zoom-in">
                <SmartImage src={src} alt={alt} fill sizes="112px" className="object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <span className="opacity-0 transition-opacity group-hover:opacity-100 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">View</span>
                </div>
            </button>
            {open && <ImagePreviewModal src={src} alt={alt} onClose={() => setOpen(false)} />}
        </>
    );
};

const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-baseline gap-1.5 text-xs">
            <span className="text-text-light shrink-0">{label}:</span>
            <span className="text-ink font-medium truncate">{value}</span>
        </div>
    );
};

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
    }, []);

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
            const hay = `${o.id} ${o.User?.name || ''} ${o.User?.email || ''} ${o.User?.phone || ''}`.toLowerCase();
            if (!hay.includes(needle)) return false;
        }
        return true;
    });

    const counts = STATUSES.reduce((acc, s) => {
        acc[s] = orders.filter((o) => (o.orderStatus || o.status) === s).length;
        return acc;
    }, { All: orders.length });

    const getItemProductSnapshot = (item) => item.productSnapshot || {};

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
                        placeholder="Search order ID, customer, phone…"
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

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-background-light animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="border border-border bg-surface p-12 text-center text-sm text-text-light">No orders match.</div>
                ) : (
                    filtered.map((o) => {
                        const status = o.orderStatus || o.status || 'Ordered';
                        const isOpen = expanded === o.id;
                        return (
                            <div key={o.id} className="border border-border bg-surface">
                                {/* Order Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                                    <button
                                        onClick={() => setExpanded(isOpen ? null : o.id)}
                                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                    >
                                        <ChevronDown className={`h-4 w-4 shrink-0 text-text-light transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                <p className="font-mono text-xs text-text-light">#{o.id}</p>
                                                <p className="truncate text-sm font-semibold">
                                                    {o.User?.name || 'Guest'}
                                                    <span className="ml-1.5 font-normal text-text-light">{o.User?.email || ''}</span>
                                                </p>
                                            </div>
                                            <p className="mt-0.5 text-xs text-text-light">
                                                {formatDate(o.createdAt)} · {o.items?.length || 0} item(s) · {o.paymentMethod || '—'}
                                                {o.User?.phone && <span className="ml-2">· {o.User.phone}</span>}
                                            </p>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <p className="font-display text-lg font-semibold tabular-nums">{formatINR(o.totalPrice)}</p>
                                        <span className={`inline-block border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${PAYMENT_COLOR[o.isPaid] || PAYMENT_COLOR.false}`}>
                                            {o.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
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

                                {/* Order Items Preview */}
                                <div className="border-t border-border px-5 py-4">
                                    {(o.items || []).map((it) => {
                                        const snap = getItemProductSnapshot(it);
                                        return (
                                            <div key={it.id} className="flex gap-4">
                                                <ProductImage src={it.image} alt={it.name} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-semibold">{snap.productName || it.name}</span>
                                                                {snap.isCustom && (
                                                                    <span className="inline-block border border-purple-300 bg-purple-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-purple-700">
                                                                        Custom Order
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-text-light">
                                                                {snap.brand && <span>Brand: <span className="text-ink font-medium">{snap.brand}</span></span>}
                                                                {snap.model && <span>Model: <span className="text-ink font-medium">{snap.model}</span></span>}
                                                                {snap.category && <span>Category: <span className="text-ink font-medium">{snap.category}</span></span>}
                                                                {snap.sku && <span>SKU: <span className="font-mono text-ink">{snap.sku}</span></span>}
                                                                {snap.material && <span>Material: <span className="text-ink font-medium">{snap.material}</span></span>}
                                                                {snap.color && <span>Color: <span className="text-ink font-medium">{snap.color}</span></span>}
                                                                {snap.size && <span>Size: <span className="text-ink font-medium">{snap.size}</span></span>}
                                                                {snap.designType && <span>Design: <span className="text-ink font-medium">{snap.designType}</span></span>}
                                                            </div>
                                                            {snap.selectedVariant && (
                                                                <p className="mt-0.5 text-xs text-text-light">Variant: <span className="text-ink font-medium">{snap.selectedVariant}</span></p>
                                                            )}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-sm font-semibold tabular-nums">{formatINR(Number(it.price) * Number(it.qty))}</span>
                                                            <p className="text-xs text-text-light">Qty: {it.qty} × {formatINR(it.price)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Custom order additional details */}
                                                    {snap.isCustom && (
                                                        <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-purple-100 bg-purple-50/50 p-3 md:grid-cols-2">
                                                            {snap.customText && (
                                                                <div>
                                                                    <SectionHeading icon={Palette} title="Custom Text" />
                                                                    <p className="text-xs text-ink">{snap.customText}</p>
                                                                </div>
                                                            )}
                                                            {snap.bgColor && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-light">Background:</span>
                                                                    <span className="h-5 w-5 rounded border border-border" style={{ backgroundColor: snap.bgColor }} />
                                                                    <span className="font-mono text-[10px] text-text-light">{snap.bgColor}</span>
                                                                </div>
                                                            )}
                                                            {snap.layerCount > 0 && (
                                                                <div>
                                                                    <SectionHeading icon={Layers} title="Design Layers" />
                                                                    <span className="text-xs text-ink">{snap.layerCount} layer(s)</span>
                                                                </div>
                                                            )}
                                                            {snap.uploadedImages && snap.uploadedImages.length > 0 && (
                                                                <div>
                                                                    <SectionHeading icon={ImageIcon} title="Uploaded Images" />
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {snap.uploadedImages.slice(0, 4).map((url, i) => (
                                                                            <div key={i} className="h-14 w-14 overflow-hidden rounded border border-border bg-background-light">
                                                                                <img src={url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                                                                            </div>
                                                                        ))}
                                                                        {snap.uploadedImages.length > 4 && (
                                                                            <span className="flex h-14 w-14 items-center justify-center rounded border border-border bg-background-light text-[10px] text-text-light">
                                                                                +{snap.uploadedImages.length - 4}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Action buttons row */}
                                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                                    <button
                                        onClick={() => setExpanded(isOpen ? null : o.id)}
                                        className="text-xs text-text-light hover:text-ink transition-colors"
                                    >
                                        {isOpen ? 'Hide details' : 'Show customer & shipping details'}
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => invoiceAction(o)}
                                            disabled={invoiceLoading === o.id}
                                            className="inline-flex items-center gap-1.5 text-xs text-text-light hover:text-bronze disabled:opacity-50 transition-colors"
                                        >
                                            <FileText className="h-3.5 w-3.5" /> {invoiceLoading === o.id ? 'Generating…' : 'Invoice / Download'}
                                        </button>
                                        <Link href={`/order-confirmation/${o.id}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs text-text-light hover:text-bronze transition-colors">
                                            Customer view <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isOpen && (
                                    <div className="border-t border-border px-5 py-5 bg-background-light/30">
                                        <div className="grid gap-5 md:grid-cols-2">
                                            {/* Customer Details */}
                                            <div className="rounded-lg border border-border bg-surface p-4">
                                                <SectionHeading icon={User} title="Customer Details" />
                                                <div className="space-y-1.5">
                                                    <DetailRow label="Name" value={o.User?.name} />
                                                    <DetailRow label="Phone" value={o.User?.phone || o.shippingAddress?.phone} />
                                                    <DetailRow label="Email" value={o.User?.email || o.shippingAddress?.email} />
                                                </div>
                                            </div>

                                            {/* Shipping Address */}
                                            <div className="rounded-lg border border-border bg-surface p-4">
                                                <SectionHeading icon={MapPin} title="Shipping Address" />
                                                <div className="space-y-1.5">
                                                    <DetailRow label="Address" value={o.shippingAddress?.address} />
                                                    <DetailRow label="City" value={o.shippingAddress?.city} />
                                                    <DetailRow label="State" value={o.shippingAddress?.state} />
                                                    <DetailRow label="Pincode" value={o.shippingAddress?.postalCode} />
                                                    <DetailRow label="Country" value={o.shippingAddress?.country} />
                                                </div>
                                            </div>

                                            {/* Order Details */}
                                            <div className="rounded-lg border border-border bg-surface p-4">
                                                <SectionHeading icon={Package} title="Order Details" />
                                                <div className="space-y-1.5">
                                                    <DetailRow label="Order ID" value={`#${o.id}`} />
                                                    <DetailRow label="Date" value={formatDate(o.createdAt)} />
                                                    <DetailRow label="Items" value={`${o.items?.length || 0} item(s)`} />
                                                    <DetailRow label="Tracking" value={o.trackingNumber || '—'} />
                                                </div>
                                            </div>

                                            {/* Payment Details */}
                                            <div className="rounded-lg border border-border bg-surface p-4">
                                                <SectionHeading icon={CreditCard} title="Payment Details" />
                                                <div className="space-y-1.5">
                                                    <DetailRow label="Payment" value={o.paymentMethod} />
                                                    <DetailRow label="Status" value={o.isPaid ? 'Paid' : 'Unpaid'} />
                                                    <DetailRow label="Subtotal" value={formatINR(o.itemsPrice)} />
                                                    <DetailRow label="Tax" value={formatINR(o.taxPrice)} />
                                                    <DetailRow label="Shipping" value={formatINR(o.shippingPrice)} />
                                                    <DetailRow label="Total" value={formatINR(o.totalPrice)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}
