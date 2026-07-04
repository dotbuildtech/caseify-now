'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminListDeviceModels, adminDeleteDeviceModel, adminListBrands } from '@/services/adminApi';
import { formatDate } from '@/utils/format';

export default function AdminModelsPage() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [deviceType, setDeviceType] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { q };
            if (brandFilter) params.brandId = brandFilter;
            if (deviceType) params.deviceType = deviceType;
            const [models, brandsList] = await Promise.all([
                adminListDeviceModels(params),
                adminListBrands()
            ]);
            setItems(models);
            setBrands(brandsList);
        } catch (e) {
            toast.error('Failed to load device models');
        } finally {
            setLoading(false);
        }
    }, [q, brandFilter, deviceType]);

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

    const del = async (model) => {
        if (!confirm(`Delete "${model.name}"?`)) return;
        try {
            await adminDeleteDeviceModel(model.id);
            toast.success('Model deleted');
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Device Models</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${items.length} models`}</p>
                </div>
                <Link href="/admin/models/new" className="btn-primary">
                    <Plus className="h-4 w-4" /> New model
                </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_140px]">
                <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink">
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models…" className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-text-light" />
                </div>
                <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="input-luxe">
                    <option value="">All brands</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="input-luxe">
                    <option value="">All types</option>
                    <option value="phone">Phone</option>
                    <option value="smartwatch">Smartwatch</option>
                    <option value="laptop">Laptop</option>
                    <option value="tablet">Tablet</option>
                    <option value="earbuds">Earbuds</option>
                </select>
            </div>
            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-background-light animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">No models found.</div>
                ) : (
                        <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
                        {items.map((m) => (
                            <li key={m.id} className="flex items-center justify-between gap-3 p-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">{m.name}</p>
                                    <p className="text-[10px] text-text-light">
                                        {m.Brand?.name || '—'} · {m.deviceType} · {m.isActive ? 'Active' : 'Inactive'} · {formatDate(m.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/models/${m.id}`} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Link>
                                    <button onClick={() => del(m)} className="inline-flex h-8 w-8 items-center justify-center border border-border text-error hover:border-error">
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
