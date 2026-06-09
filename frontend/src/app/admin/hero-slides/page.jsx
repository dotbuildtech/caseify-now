'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { formatDate } from '@/utils/format';

export default function AdminHeroSlidesPage() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedIdx, setDraggedIdx] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/hero-slides', { params: { all: 'true' } });
            setItems(r.data?.data || []);
        } catch { toast.error('Failed to load hero slides'); }
        finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const del = async (slide) => {
        if (!confirm(`Delete hero slide "${slide.title}"?`)) return;
        try {
            await api.delete(`/hero-slides/${slide.id}`);
            toast.success('Slide deleted');
            load();
        } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
    };

    const toggleActive = async (slide) => {
        try {
            await api.put(`/hero-slides/${slide.id}`, { isActive: !slide.isActive });
            load();
        } catch (e) { toast.error('Toggle failed'); }
    };

    const handleDragStart = (idx) => setDraggedIdx(idx);
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === idx) return;
        const reordered = [...items];
        const [moved] = reordered.splice(draggedIdx, 1);
        reordered.splice(idx, 0, moved);
        setItems(reordered);
        setDraggedIdx(idx);
    };
    const handleDragEnd = async () => {
        setDraggedIdx(null);
        try {
            await api.put('/hero-slides/reorder', { ids: items.map((s) => s.id) });
        } catch { load(); }
    };

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Hero Slides</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${items.length} slides`}</p>
                </div>
                <Link href="/admin/hero-slides/new" className="btn-primary">
                    <Plus className="h-4 w-4" /> New slide
                </Link>
            </div>

            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-background-light animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">No hero slides yet.</div>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((s, idx) => (
                            <li key={s.id}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-4 p-4 ${!s.isActive ? 'opacity-50' : ''}`}>
                                <div className="cursor-grab active:cursor-grabbing text-text-light">
                                    <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="relative h-16 w-28 shrink-0 overflow-hidden border border-border bg-background-light">
                                    {s.bg ? (
                                        <img src={s.bg} alt={s.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[10px] text-text-light">No img</div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{s.title}</p>
                                    <p className="text-[10px] text-text-light truncate">{s.subtitle || '—'}</p>
                                    <p className="text-[10px] text-text-light mt-0.5">
                                        <span className="border border-border px-1.5 py-0.5">{s.ctaText}</span>
                                        <span className="ml-2">Order {s.sortOrder}</span>
                                        <span className="ml-2">{formatDate(s.createdAt)}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => toggleActive(s)}
                                        className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink"
                                        title={s.isActive ? 'Deactivate' : 'Activate'}>
                                        {s.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                    </button>
                                    <Link href={`/admin/hero-slides/${s.id}`}
                                        className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Link>
                                    <button onClick={() => del(s)}
                                        className="inline-flex h-8 w-8 items-center justify-center border border-border text-error hover:border-error">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <p className="text-[10px] text-text-light mt-2">Drag rows to reorder slides.</p>
        </>
    );
}
