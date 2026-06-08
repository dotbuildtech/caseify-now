'use client';
import { useEffect, useState } from 'react';
import { Boxes, Minus, Plus, RefreshCw } from 'lucide-react';
import { adminListInventory, adminUpdateStock } from '@/services/adminApi';
import { formatDate } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

export default function AdminInventoryPage() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adjusting, setAdjusting] = useState(null);
    const [adj, setAdj] = useState({ change: 0, reason: '' });

    const load = async () => {
        setLoading(true);
        try {
            const d = await adminListInventory();
            setItems(Array.isArray(d) ? d : []);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const submitAdj = async (it) => {
        const change = Number(adj.change);
        if (!Number.isFinite(change) || change === 0) { toast.error('Enter a non-zero change'); return; }
        if (!adj.reason.trim()) { toast.error('Enter a reason'); return; }
        try {
            const updated = await adminUpdateStock(it.id, { change, reason: adj.reason.trim() });
            setItems((arr) => arr.map((x) => x.id === it.id ? updated : x));
            toast.success('Stock updated');
            setAdjusting(null);
            setAdj({ change: 0, reason: '' });
        } catch (e) {
            toast.error(e.response?.data?.message || 'Update failed');
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Inventory</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${items.length} tracked items`}</p>
                </div>
                <button onClick={load} className="btn-ghost">
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="border border-border bg-surface">
                {loading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-background-light animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-sm text-text-light">
                        <Boxes className="mx-auto mb-3 h-8 w-8 text-text-light" strokeWidth={1.25} />
                        <p>No inventory records yet.</p>
                        <p className="mt-1 text-[11px]">Inventory rows are created when products are first stocked.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((it) => {
                            const low = Number(it.quantity) <= Number(it.lowStockThreshold || 0);
                            const isOpen = adjusting === it.id;
                            return (
                                <li key={it.id} className="p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{it.Product?.name || `Product #${it.ProductId}`}</p>
                                            <p className="mt-0.5 text-xs text-text-light">{it.Product?.category || '—'} · last restock {it.lastRestocked ? formatDate(it.lastRestocked) : '—'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className={`font-display text-xl tabular-nums ${low ? 'text-error' : ''}`}>{it.quantity}</p>
                                                <p className="text-[10px] uppercase tracking-[0.18em] text-text-light">threshold {it.lowStockThreshold}</p>
                                            </div>
                                            <button
                                                onClick={() => { setAdjusting(isOpen ? null : it.id); setAdj({ change: 0, reason: '' }); }}
                                                className="btn-secondary !px-4 !py-2 !text-[10px]"
                                            >
                                                {isOpen ? 'Cancel' : 'Adjust'}
                                            </button>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="mt-3 grid gap-3 border-t border-border pt-3 md:grid-cols-[140px_1fr_auto]">
                                            <div className="flex items-stretch border border-border">
                                                <button onClick={() => setAdj((a) => ({ ...a, change: Number(a.change) - 1 }))} className="px-3 hover:bg-background-light">
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={adj.change}
                                                    onChange={(e) => setAdj((a) => ({ ...a, change: e.target.value }))}
                                                    className="w-full bg-transparent text-center tabular-nums outline-none"
                                                />
                                                <button onClick={() => setAdj((a) => ({ ...a, change: Number(a.change) + 1 }))} className="px-3 hover:bg-background-light">
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <input
                                                value={adj.reason}
                                                onChange={(e) => setAdj((a) => ({ ...a, reason: e.target.value }))}
                                                placeholder="Reason (e.g. Restock, Damaged, Adjustment)"
                                                className="input-luxe !py-2"
                                            />
                                            <button onClick={() => submitAdj(it)} className="btn-primary !px-5 !py-2">Apply</button>
                                        </div>
                                    )}

                                    {isOpen && Array.isArray(it.history) && it.history.length > 0 && (
                                        <div className="mt-3 border-t border-border pt-3">
                                            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Recent history</p>
                                            <ul className="mt-2 divide-y divide-border border border-border">
                                                {it.history.slice(-5).reverse().map((h, i) => (
                                                    <li key={i} className="flex items-center justify-between gap-3 p-2 text-xs">
                                                        <span className={h.change > 0 ? 'text-success' : 'text-error'}>{h.change > 0 ? '+' : ''}{h.change}</span>
                                                        <span className="flex-1 truncate text-text-light">{h.reason}</span>
                                                        <span className="text-text-light">{formatDate(h.date)}</span>
                                                    </li>
                                                ))}
                                            </ul>
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
