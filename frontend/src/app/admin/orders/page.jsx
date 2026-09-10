'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ExternalLink, FileText, X, User, Package, MapPin, CreditCard, ImageIcon, Palette, Layers, Zap, Shield, Headphones, Battery, Cable, Download, Eye, FolderDown, Sparkles } from 'lucide-react';
import { FORM_FIELD_LABELS } from '@/utils/constants';
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

const ImagePreviewModal = ({ src, alt, title = 'Artwork Preview', onClose }) => {
    const ref = useRef(null);
    const [downloading, setDownloading] = useState(false);
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const res = await fetch(src);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = blob.type?.includes('jpeg') ? 'jpg' : blob.type?.includes('png') ? 'png' : 'png';
            a.download = `${(alt || 'custom-artwork').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            const a = document.createElement('a');
            a.href = src;
            a.download = `${(alt || 'custom-artwork').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally { setDownloading(false); }
    };
    return (
        <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
            <div className="relative flex flex-col max-h-[92vh] max-w-[92vw] bg-surface rounded-xl border border-border shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-background-light/90 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-text-light" />
                        <span className="text-xs font-semibold text-ink truncate max-w-xs sm:max-w-md">{title || alt || 'Custom Image'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-cream px-3 py-1 text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>{downloading ? 'Downloading…' : 'Download Full Image'}</span>
                        </button>
                        <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-background-light transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Open in Tab</span>
                        </a>
                        <button onClick={onClose} className="rounded-lg p-1 text-text-light hover:text-ink hover:bg-background-light transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="relative flex items-center justify-center p-4 bg-black/5 dark:bg-black/40 overflow-auto max-h-[80vh]">
                    <img src={src} alt={alt} className="max-h-[75vh] max-w-[85vw] object-contain rounded shadow-md select-none" />
                </div>
            </div>
        </div>
    );
};

const CustomerAssetCard = ({ src, label, filename, orderId }) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const onDownload = async (e) => {
        e.stopPropagation();
        if (downloading) return;
        setDownloading(true);
        try {
            const res = await fetch(src);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `order-${orderId}-customer-asset.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            const a = document.createElement('a');
            a.href = src;
            a.download = filename || `order-${orderId}-customer-asset.png`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <div className="group relative flex flex-col rounded-lg border border-purple-200/80 bg-surface p-2 shadow-sm transition-all hover:border-purple-500 hover:shadow-md">
                <div
                    onClick={() => setPreviewOpen(true)}
                    className="relative aspect-square w-24 overflow-hidden rounded-md bg-background-light cursor-zoom-in sm:w-28"
                >
                    <img
                        src={src}
                        alt={label}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                        <span className="flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <Eye className="h-3 w-3" /> View
                        </span>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-1">
                    <p className="truncate text-[11px] font-medium text-ink" title={label}>{label}</p>
                    <button
                        onClick={onDownload}
                        disabled={downloading}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-background-light text-text-light hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 transition-colors disabled:opacity-50"
                        title="Download full resolution image"
                    >
                        <Download className="h-3 w-3" />
                    </button>
                </div>
            </div>
            {previewOpen && (
                <ImagePreviewModal
                    src={src}
                    alt={label}
                    title={`${label} (Order #${orderId})`}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </>
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

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
                                                            {snap.attributes && Object.entries(snap.attributes).map(([key, val]) => {
                                                                if (!val || ['color', 'size', 'designType'].includes(key)) return null;
                                                                const label = FORM_FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                                                                return <span key={key}>{label}: <span className="text-ink font-medium">{val}</span></span>;
                                                            })}
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

                                                    {/* Custom order Work Center & Artwork Section */}
                                                    {snap.isCustom && (
                                                        <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-900">
                                                                        Work Center · Customization Assets
                                                                    </span>
                                                                </div>
                                                                {snap.uploadedImages && snap.uploadedImages.length > 0 && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            for (let idx = 0; idx < snap.uploadedImages.length; idx++) {
                                                                                const u = snap.uploadedImages[idx];
                                                                                const a = document.createElement('a');
                                                                                a.href = u;
                                                                                a.download = `order-${o.id}-asset-${idx + 1}.png`;
                                                                                a.target = '_blank';
                                                                                document.body.appendChild(a);
                                                                                a.click();
                                                                                document.body.removeChild(a);
                                                                                await new Promise(r => setTimeout(r, 300));
                                                                            }
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 rounded-md border border-purple-300 bg-white px-2.5 py-1 text-[11px] font-medium text-purple-700 shadow-sm hover:bg-purple-50 transition-colors"
                                                                    >
                                                                        <FolderDown className="h-3.5 w-3.5 text-purple-600" />
                                                                        <span>Download All Assets ({snap.uploadedImages.length})</span>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Customer Uploaded Files Grid */}
                                                            {snap.uploadedImages && snap.uploadedImages.length > 0 ? (
                                                                <div>
                                                                    <SectionHeading icon={ImageIcon} title={`Customer Uploaded Images (${snap.uploadedImages.length})`} />
                                                                    <div className="flex flex-wrap gap-2.5">
                                                                        {snap.uploadedImages.map((url, i) => (
                                                                            <CustomerAssetCard
                                                                                key={i}
                                                                                src={url}
                                                                                label={`Customer Asset #${i + 1}`}
                                                                                filename={`order-${o.id}-item-${it.id}-customer-asset-${i + 1}.png`}
                                                                                orderId={o.id}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-text-light italic">
                                                                    No external image files attached by user for this item.
                                                                </div>
                                                            )}

                                                            {/* Custom Text / Specs / Background Grid */}
                                                            <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                                                                {snap.customText && (
                                                                    <div className="rounded border border-purple-100 bg-white/70 p-2.5">
                                                                        <SectionHeading icon={Palette} title="Custom Text" />
                                                                        <p className="font-semibold text-ink break-words">{snap.customText}</p>
                                                                    </div>
                                                                )}
                                                                {snap.bgColor && (
                                                                    <div className="rounded border border-purple-100 bg-white/70 p-2.5">
                                                                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-light block mb-1">Canvas Background</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="h-5 w-5 rounded border border-border shadow-sm" style={{ backgroundColor: snap.bgColor }} />
                                                                            <span className="font-mono text-xs text-ink">{snap.bgColor}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {snap.layerCount > 0 && (
                                                                    <div className="rounded border border-purple-100 bg-white/70 p-2.5">
                                                                        <SectionHeading icon={Layers} title="Design Complexity" />
                                                                        <p className="font-medium text-ink">{snap.layerCount} layer(s) configured</p>
                                                                    </div>
                                                                )}
                                                            </div>
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
