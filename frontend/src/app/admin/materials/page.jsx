'use client';
import { useState, useEffect } from 'react';
import { adminListMaterials, adminCreateMaterial, adminUpdateMaterial, adminDeleteMaterial } from '@/services/adminApi';
import { useToast } from '@/components/ui/Toast';
import { Plus, Save, X, Trash2, Edit3, Check, Star, IndianRupee } from 'lucide-react';
import { formatINR } from '@/utils/format';

export default function MaterialsPage() {
    const toast = useToast();
    const [materials, setMaterials] = useState([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('399');
    const [isDefault, setIsDefault] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editDefault, setEditDefault] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchErr, setFetchErr] = useState(null);

    useEffect(() => {
        adminListMaterials().then(setMaterials).catch(() => setFetchErr('Failed to load materials')).finally(() => setLoading(false));
    }, []);

    const create = async () => {
        if (!name.trim()) return toast.error('Enter a material name');
        const p = parseInt(price, 10);
        if (isNaN(p) || p < 0) return toast.error('Enter a valid price');
        try {
            const m = await adminCreateMaterial({ name: name.trim(), price: p, isDefault });
            setMaterials((prev) => [...prev, m]);
            setName('');
            setPrice('399');
            setIsDefault(false);
            toast.success('Material created');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const startEdit = (m) => {
        setEditing(m.id);
        setEditName(m.name);
        setEditPrice(String(m.price ?? 399));
        setEditDefault(m.isDefault);
    };

    const saveEdit = async (id) => {
        if (!editName.trim()) return toast.error('Name required');
        const p = parseInt(editPrice, 10);
        if (isNaN(p) || p < 0) return toast.error('Enter a valid price');
        try {
            const m = await adminUpdateMaterial(id, { name: editName.trim(), price: p, isDefault: editDefault });
            setMaterials((prev) => prev.map((x) => (x.id === id ? { ...x, name: m.name, price: m.price, isDefault: m.isDefault } : (editDefault && m.isDefault ? { ...x, isDefault: x.id === id } : x))));
            setEditing(null);
            toast.success('Updated');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const remove = async (id) => {
        if (!confirm('Delete this material?')) return;
        try {
            await adminDeleteMaterial(id);
            setMaterials((prev) => prev.filter((x) => x.id !== id));
            toast.success('Deleted');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl">Materials</h1>
                <p className="mt-1 text-xs text-text-light">Manage materials with prices. Pick one as default for the studio.</p>
            </div>

            <div className="flex flex-wrap items-end gap-3 border border-border bg-surface p-4">
                <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-text-light">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
                        placeholder="e.g. Matte Hard Case" className="input-luxe w-full" />
                </div>
                <div className="w-28">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-text-light">Price (&#8377;)</label>
                    <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
                        className="input-luxe w-full" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-1">
                    <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-stone-900" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-light">Default</span>
                </label>
                <button onClick={create} className="btn-primary !py-2 text-xs whitespace-nowrap">
                    <Plus className="h-3.5 w-3.5" /> Add
                </button>
            </div>

            {fetchErr && <p className="text-sm text-error mb-4">{fetchErr}</p>}
            {loading ? (
                <div className="text-xs text-text-light">Loading…</div>
            ) : materials.length === 0 ? (
                <div className="border border-dashed border-border bg-surface p-8 text-center">
                    <p className="text-sm text-text-light">No materials yet. Add one above.</p>
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-text-light">
                                <th className="py-2 pr-4">Default</th>
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2 pr-4">Price</th>
                                <th className="py-2 pr-4">Slug</th>
                                <th className="py-2 pr-4">Active</th>
                                <th className="py-2 w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((m) => (
                                <tr key={m.id} className="border-b border-border/50 group">
                                    {editing === m.id ? (
                                        <>
                                            <td className="py-2 pr-4">
                                                <input type="checkbox" checked={editDefault}
                                                    onChange={(e) => setEditDefault(e.target.checked)}
                                                    className="h-4 w-4 rounded border-border accent-stone-900" />
                                            </td>
                                            <td className="py-2 pr-4">
                                                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') setEditing(null); }}
                                                    className="w-full border border-border bg-background-light px-2 py-1 text-xs outline-none" autoFocus />
                                            </td>
                                            <td className="py-2 pr-4">
                                                <input type="number" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') setEditing(null); }}
                                                    className="w-20 border border-border bg-background-light px-2 py-1 text-xs outline-none" />
                                            </td>
                                            <td className="py-2 pr-4 text-xs text-text-light">{m.slug}</td>
                                            <td className="py-2 pr-4">
                                                <span className={`inline-block h-2 w-2 rounded-full ${m.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                            </td>
                                            <td className="py-2">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => saveEdit(m.id)} className="p-1 text-ink"><Check className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => setEditing(null)} className="p-1 text-text-light"><X className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-2 pr-4">
                                                {m.isDefault ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <span className="text-text-light/30">—</span>}
                                            </td>
                                            <td className="py-2 pr-4 font-medium">{m.name}</td>
                                            <td className="py-2 pr-4 font-mono tabular-nums">{formatINR(m.price)}</td>
                                            <td className="py-2 pr-4 text-xs text-text-light">{m.slug}</td>
                                            <td className="py-2 pr-4">
                                                <span className={`inline-block h-2 w-2 rounded-full ${m.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                            </td>
                                            <td className="py-2">
                                                <div className="hidden group-hover:flex items-center gap-1">
                                                    <button onClick={() => startEdit(m)} className="p-1 text-text-light hover:text-ink"><Edit3 className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => remove(m.id)} className="p-1 text-text-light hover:text-error"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
