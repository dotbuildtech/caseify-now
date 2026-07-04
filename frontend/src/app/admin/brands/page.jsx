'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminListBrands, adminDeleteBrand } from '@/services/adminApi';
import { formatDate } from '@/utils/format';

export default function AdminBrandsPage() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const brands = await adminListBrands({ q });
            setItems(brands);
        } catch (e) {
            toast.error('Failed to load brands');
        } finally {
            setLoading(false);
        }
    }, [q]);

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

    const del = async (brand) => {
        if (!confirm(`Delete "${brand.name}"?`)) return;
        try {
            await adminDeleteBrand(brand.id);
            toast.success('Brand deleted');
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Brands</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${items.length} brands`}</p>
                </div>
                <Link href="/admin/brands/new" className="btn-primary">
                    <Plus className="h-4 w-4" /> New brand
                </Link>
            </div>
            <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search brands…"
                    className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-text-light"
                />
            </div>
            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-background-light animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">No brands found.</div>
                ) : (
                        <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
                        {items.map((b) => (
                            <li key={b.id} className="flex items-center justify-between gap-3 p-4">
                                <div className="min-w-0 flex items-center gap-3">
                                    {b.logo ? (
                                        <img src={b.logo} alt={b.name} className="h-8 w-8 object-contain" />
                                    ) : (
                                        <div className="h-8 w-8 flex items-center justify-center bg-background-light text-[10px] font-bold uppercase">{b.name[0]}</div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">{b.name}</p>
                                        <p className="text-[10px] text-text-light">{b.isActive ? 'Active' : 'Inactive'} · {formatDate(b.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/brands/${b.id}`} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Link>
                                    <button onClick={() => del(b)} className="inline-flex h-8 w-8 items-center justify-center border border-border text-error hover:border-error">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
