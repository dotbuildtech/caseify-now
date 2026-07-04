'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, CheckCircle2, XCircle, Package } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminListStudioProducts, adminDeleteStudioProduct } from '@/services/adminApi';
import { formatINR } from '@/utils/format';
import SmartImage from '@/components/ui/SmartImage';

export default function AdminStudioProductsPage() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminListStudioProducts();
            setItems(data);
        } catch {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const del = async (d) => {
        if (!confirm(`Delete "${d.name}"?`)) return;
        setDeleting(d.id);
        try {
            await adminDeleteStudioProduct(d.id);
            toast.success('Product deleted');
            setItems((arr) => arr.filter((x) => x.id !== d.id));
        } catch {
            toast.error('Delete failed');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Studio Products</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading\u2026' : `${items.length} products`}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/custom-designs" className="btn-secondary text-sm">
                        <Package className="h-4 w-4" /> Brand/Model
                    </Link>
                    <Link href="/admin/custom-designs/products/new" className="btn-primary">
                        <Plus className="h-4 w-4" /> New Product
                    </Link>
                </div>
            </div>

            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-background-light animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">
                        <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        No products found. Create your first studio product.
                    </div>
                ) : (
                    <>
                        <div className="hidden grid-cols-[56px_2fr_1fr_100px_100px_80px_80px_100px] gap-3 border-b border-border bg-background-light px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light md:grid">
                            <span />
                            <span>Name</span>
                            <span>Model</span>
                            <span className="text-right">Price</span>
                            <span className="text-right">Compare</span>
                            <span>Material</span>
                            <span className="text-center">Active</span>
                            <span className="text-right">Actions</span>
                        </div>
                        <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
                            {items.map((d) => (
                                <li key={d.id} className="grid grid-cols-2 gap-3 p-4 md:grid-cols-[56px_2fr_1fr_100px_100px_80px_80px_100px]">
                                    <div className="relative h-14 w-14 overflow-hidden border border-border bg-background-light">
                                        <SmartImage src={d.image} alt={d.name} fill sizes="56px" className="object-cover" />
                                    </div>
                                    <div className="min-w-0 self-center">
                                        <Link href={`/admin/custom-designs/products/${d.id}`} className="block truncate text-sm font-medium hover:text-bronze">{d.name}</Link>
                                        {d.description && <p className="mt-0.5 truncate text-xs text-text-light">{d.description}</p>}
                                    </div>
                                    <div className="self-center text-xs text-text-light">{d.StudioModel?.name || '\u2014'}</div>
                                    <div className="self-center text-right font-display text-sm tabular-nums">
                                        {formatINR(d.price)}
                                    </div>
                                    <div className="self-center text-right text-sm tabular-nums">
                                        {d.compareAtPrice ? (
                                            <span className="text-xs text-text-light line-through">{formatINR(d.compareAtPrice)}</span>
                                        ) : '\u2014'}
                                    </div>
                                    <div className="self-center text-xs text-text-light">{d.Material?.name || '\u2014'}</div>
                                    <div className="flex items-center justify-center self-center">
                                        {d.isActive ? (
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-text-light" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 self-center">
                                        <Link href={`/admin/custom-designs/products/${d.id}`} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink" title="Edit">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Link>
                                        <button
                                            onClick={() => del(d)}
                                            disabled={deleting === d.id}
                                            className="inline-flex h-8 w-8 items-center justify-center border border-border text-error hover:border-error disabled:opacity-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </>
    );
}
