'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { adminListProducts, adminDeleteProduct } from '@/services/adminApi';
import { formatINR, formatDate } from '@/utils/format';
import { PRODUCT_CATEGORIES } from '@/utils/constants';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';
import SearchableSelect from '@/components/ui/SearchableSelect';

function AdminProductsPageContent() {
    const search = useSearchParams();
    const lowStockOnly = search.get('lowStock') === '1';
    const toast = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;
    const [q, setQ] = useState('');
    const [category, setCategory] = useState('');
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (q.trim()) params.q = q.trim();
            if (category.trim()) params.category = category.trim();
            const res = await adminListProducts(params);
            let data = res.data || [];
            if (lowStockOnly) data = data.filter((p) => Number(p.stock) <= Number(p.lowStockThreshold || 0));
            setItems(data);
            setTotal(res.pagination?.total ?? data.length);
        } catch (e) {
            toastRef.current.error(e.response?.data?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [q, category, page, lowStockOnly]);

    useEffect(() => {
        const controller = new AbortController();
        const t = setTimeout(() => { load(); }, 300);
        return () => { clearTimeout(t); controller.abort(); };
    }, [load]);

    const del = async (p) => {
        if (!confirm(`Delete "${p.name}"? This soft-deletes the product.`)) return;
        setDeleting(p.id);
        try {
            await adminDeleteProduct(p.id);
            toast.success('Product deleted');
            setItems((arr) => arr.filter((x) => x.id !== p.id));
        } catch (e) {
            toast.error(e.response?.data?.message || 'Delete failed');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Products {lowStockOnly && <span className="text-bronze">· Low stock</span>}</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${total} total`}</p>
                </div>
                <Link href="/admin/products/new" className="btn-primary">
                    <Plus className="h-4 w-4" /> New product
                </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink">
                    <Search className="h-4 w-4 text-text-light" />
                    <input
                        value={q}
                        onChange={(e) => { setPage(1); setQ(e.target.value); }}
                        placeholder="Search name, sku, tags…"
                        className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-text-light"
                    />
                </div>
                <SearchableSelect
                    value={category}
                    onChange={(v) => { setPage(1); setCategory(v); }}
                    options={PRODUCT_CATEGORIES}
                    placeholder="All categories"
                />
            </div>

            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-background-light animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="border-t border-border p-12 text-center">
                        <p className="text-sm text-text-light">No products match.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden grid-cols-[64px_2fr_1fr_120px_100px_100px_120px] gap-3 border-b border-border bg-background-light px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light md:grid">
                            <span />
                            <span>Product</span>
                            <span>Category</span>
                            <span className="text-right">Price</span>
                            <span className="text-right">Stock</span>
                            <span className="text-center">Status</span>
                            <span className="text-right">Actions</span>
                        </div>
                        <ul className="divide-y divide-border">
                            {items.map((p) => {
                                const low = Number(p.stock) <= Number(p.lowStockThreshold || 0);
                                const img = Array.isArray(p.images) && p.images[0]
                                    ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
                                    : p.image;
                                return (
                                    <li key={p.id} className="grid grid-cols-2 gap-3 p-4 md:grid-cols-[64px_2fr_1fr_120px_100px_100px_120px]">
                                        <div className="relative h-16 w-16 overflow-hidden border border-border bg-background-light">
                                            <SmartImage src={img} alt={p.name} fill sizes="64px" className="object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <Link href={`/admin/products/${p.id}`} className="block truncate text-sm font-medium hover:text-bronze">{p.name}</Link>
                                            <p className="mt-0.5 truncate text-xs text-text-light">SKU {p.sku || '—'} · {formatDate(p.createdAt)}</p>
                                        </div>
                                        <div className="text-xs text-text-light md:self-center">{p.category || '—'}</div>
                                        <div className="text-right font-display text-sm tabular-nums md:self-center">
                                            {formatINR(p.price)}
                                            {p.compareAtPrice ? <span className="block text-[10px] text-text-light line-through">{formatINR(p.compareAtPrice)}</span> : null}
                                        </div>
                                        <div className={`text-right text-sm font-medium tabular-nums md:self-center ${low ? 'text-error' : ''}`}>
                                            {p.stock}
                                            {low && <AlertTriangle className="ml-1 inline h-3 w-3" />}
                                        </div>
                                        <div className="flex items-center justify-center md:self-center">
                                            {p.isActive ? (
                                                <CheckCircle2 className="h-4 w-4 text-success" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-text-light" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-end gap-2 md:self-center">
                                            <Link href={`/admin/products/${p.id}`} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink" title="Edit">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Link>
                                            <button
                                                onClick={() => del(p)}
                                                disabled={deleting === p.id}
                                                className="inline-flex h-8 w-8 items-center justify-center border border-border text-error hover:border-error disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </div>

            {!loading && total > 20 && (
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-ghost disabled:opacity-30"
                    >← Prev</button>
                    <span className="text-xs text-text-light">Page {page}</span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={items.length < 20}
                        className="btn-ghost disabled:opacity-30"
                    >Next →</button>
                </div>
            )}
        </>
    );
}

export default function AdminProductsPage() {
    return (
        <Suspense fallback={<div className="container py-20"><div className="h-96 bg-background-light animate-pulse rounded" /></div>}>
            <AdminProductsPageContent />
        </Suspense>
    );
}
