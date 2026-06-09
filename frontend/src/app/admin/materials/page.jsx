'use client';
import { useState, useEffect } from 'react';
import { adminListMaterials, adminCreateMaterial, adminUpdateMaterial, adminDeleteMaterial } from '@/services/adminApi';
import { useToast } from '@/components/ui/Toast';
import { Plus, Save, X, Trash2, Edit3, Check } from 'lucide-react';

export default function MaterialsPage() {
    const toast = useToast();
    const [materials, setMaterials] = useState([]);
    const [name, setName] = useState('');
    const [editing, setEditing] = useState(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminListMaterials({ isActive: 'true' }).then(setMaterials).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const create = async () => {
        if (!name.trim()) return toast.error('Enter a material name');
        try {
            const m = await adminCreateMaterial({ name: name.trim() });
            setMaterials((prev) => [...prev, m]);
            setName('');
            toast.success('Material created');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const startEdit = (m) => { setEditing(m.id); setEditName(m.name); };
    const saveEdit = async (id) => {
        if (!editName.trim()) return toast.error('Name required');
        try {
            const m = await adminUpdateMaterial(id, { name: editName.trim() });
            setMaterials((prev) => prev.map((x) => (x.id === id ? { ...x, name: m.name } : x)));
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl">Materials</h1>
                    <p className="mt-1 text-xs text-text-light">Manage product material types</p>
                </div>
            </div>

            <div className="flex items-center gap-2 border border-border bg-surface p-4">
                <input value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
                    placeholder="New material name…" className="input-luxe flex-1" />
                <button onClick={create} className="btn-primary !py-2 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add
                </button>
            </div>

            {loading ? (
                <div className="text-xs text-text-light">Loading…</div>
            ) : materials.length === 0 ? (
                <div className="border border-dashed border-border bg-surface p-8 text-center">
                    <p className="text-sm text-text-light">No materials yet. Add one above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {materials.map((m) => (
                        <div key={m.id} className="border border-border bg-surface p-3 flex items-center justify-between group">
                            {editing === m.id ? (
                                <div className="flex items-center gap-1 w-full">
                                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') setEditing(null); }}
                                        className="w-full border border-border bg-background-light px-2 py-1 text-xs outline-none"
                                        autoFocus />
                                    <button onClick={() => saveEdit(m.id)} className="p-1 text-ink"><Check className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => setEditing(null)} className="p-1 text-text-light"><X className="h-3.5 w-3.5" /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-xs font-medium truncate">{m.name}</span>
                                    <div className="hidden group-hover:flex items-center gap-1">
                                        <button onClick={() => startEdit(m)} className="p-1 text-text-light hover:text-ink"><Edit3 className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => remove(m.id)} className="p-1 text-text-light hover:text-error"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
