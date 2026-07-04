'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, CheckCircle2, XCircle, Package } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminListCustomDesigns, adminDeleteCustomDesign } from '@/services/adminApi';
import { formatINR } from '@/utils/format';
import SmartImage from '@/components/ui/SmartImage';
import StudioShowcase from '@/components/admin/StudioShowcase';

export default function AdminCustomDesignsPage() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (q.trim()) params.q = q.trim();
            const data = await adminListCustomDesigns(params);
            setItems(data);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load custom designs');
        } finally {
            setLoading(false);
        }
    }, [q]);

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

    const del = async (d) => {
        if (!confirm(`Delete "${d.name}"?`)) return;
        setDeleting(d.id);
        try {
            await adminDeleteCustomDesign(d.id);
            toast.success('Design deleted');
            setItems((arr) => arr.filter((x) => x.id !== d.id));
        } catch (e) {
            toast.error(e.response?.data?.message || 'Delete failed');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <StudioShowcase />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Custom Designs</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${items.length} designs`}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/custom-designs/products" className="btn-secondary text-sm">
                        <Package className="h-4 w-4" /> Products
                    </Link>
                    <Link href="/admin/custom-designs/new" className="btn-primary">
                        <Plus className="h-4 w-4" /> New Design
                    </Link>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr]">
                <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink">
                    <Search className="h-4 w-4 text-text-light" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs…" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-text-light" />
                </div>
            </div>
            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-background-light animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">No designs found.</div>
                ) : (
                    <>
                        <div className="hidden grid-cols-[56px_2fr_1fr_100px_100px_80px_100px] gap-3 border-b border-border bg-background-light px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light md:grid">
                            <span />
                            <span>Name</span>
                            <span>Model</span>
                            <span className="text-right">Price</span>
                            <span className="text-right">Discount</span>
                            <span className="text-center">Active</span>
                            <span className="text-right">Actions</span>
                        </div>
                        <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
                            {items.map((d) => (
                                <li key={d.id} className="grid grid-cols-2 gap-3 p-4 md:grid-cols-[56px_2fr_1fr_100px_100px_80px_100px]">
                                    <div className="relative h-14 w-14 overflow-hidden border border-border bg-background-light">
                                        <SmartImage src={d.image} alt={d.name} fill sizes="56px" className="object-cover" />
                                    </div>
                                    <div className="min-w-0 self-center">
                                        <Link href={`/admin/custom-designs/${d.id}`} className="block truncate text-sm font-medium hover:text-bronze">{d.name}</Link>
                                        {d.description && <p className="mt-0.5 truncate text-xs text-text-light">{d.description}</p>}
                                    </div>
                                    <div className="self-center text-xs text-text-light">{d.modelSlug || '—'}</div>
                                    <div className="self-center text-right font-display text-sm tabular-nums">
                                        {formatINR(d.price)}
                                    </div>
                                    <div className="self-center text-right text-sm tabular-nums">
                                        {d.compareAtPrice ? (
                                            <span className="text-xs text-text-light line-through">{formatINR(d.compareAtPrice)}</span>
                                        ) : '—'}
                                    </div>
                                    <div className="flex items-center justify-center self-center">
                                        {d.isActive ? (
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-text-light" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 self-center">
                                        <Link href={`/admin/custom-designs/${d.id}`} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink" title="Edit">
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
        </div>
    );
}