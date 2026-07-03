'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminCreateBrand, adminUpdateBrand } from '@/services/adminApi';

export default function BrandForm({ mode, initial }) {
    const router = useRouter();
    const toast = useToast();
    const [name, setName] = useState(initial?.name || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [isActive, setIsActive] = useState(initial?.isActive !== false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Name is required'); return; }
        setSaving(true);
        setError('');
        try {
            if (mode === 'edit') {
                await adminUpdateBrand(initial.id, { name: name.trim(), description: description.trim() || undefined, isActive });
                toast.success('Brand updated');
            } else {
                await adminCreateBrand({ name: name.trim(), description: description.trim() || undefined, isActive: !!isActive });
                toast.success('Brand created');
            }
            router.push('/admin/brands');
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6 max-w-xl">
            <div className="border border-border bg-surface p-5 md:p-6">
                <h3 className="mb-4 font-display text-lg">{mode === 'edit' ? 'Edit' : 'New'} Brand</h3>
                {error && <p className="mb-3 text-sm text-error">{error}</p>}
                <div className="space-y-5">
                    <div>
                        <label className="label-luxe">Brand Name *</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="input-luxe" placeholder="e.g. Apple" />
                    </div>
                    <div>
                        <label className="label-luxe">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-luxe resize-y" placeholder="Optional brand description" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-ink" />
                        Active
                    </label>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/admin/brands')} className="btn-secondary">
                    <X className="h-4 w-4" /> Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    <Save className="h-4 w-4" /> {saving ? 'Saving…' : mode === 'edit' ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}
