'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminCreateDeviceModel, adminUpdateDeviceModel, adminListBrands } from '@/services/adminApi';

export default function ModelForm({ mode, initial }) {
    const router = useRouter();
    const toast = useToast();
    const [brands, setBrands] = useState([]);
    const [name, setName] = useState(initial?.name || '');
    const [BrandId, setBrandId] = useState(initial?.BrandId || '');
    const [deviceType, setDeviceType] = useState(initial?.deviceType || 'phone');
    const [isActive, setIsActive] = useState(initial?.isActive !== false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        adminListBrands().then(setBrands).catch(() => {});
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Name is required'); return; }
        if (!BrandId) { setError('Brand is required'); return; }
        setSaving(true);
        setError('');
        try {
            const payload = { name: name.trim(), BrandId: Number(BrandId), deviceType };
            if (mode === 'edit') {
                await adminUpdateDeviceModel(initial.id, { ...payload, isActive });
                toast.success('Model updated');
            } else {
                await adminCreateDeviceModel(payload);
                toast.success('Model created');
            }
            router.push('/admin/models');
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6 max-w-xl">
            <div className="border border-border bg-surface p-5 md:p-6">
                <h3 className="mb-4 font-display text-lg">{mode === 'edit' ? 'Edit' : 'New'} Device Model</h3>
                {error && <p className="mb-3 text-sm text-error">{error}</p>}
                <div className="space-y-5">
                    <div>
                        <label className="label-luxe">Model Name *</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="input-luxe" placeholder="e.g. iPhone 16 Pro" />
                    </div>
                    <div>
                        <label className="label-luxe">Brand *</label>
                        <select value={BrandId} onChange={(e) => setBrandId(e.target.value)} className="input-luxe">
                            <option value="">Select brand…</option>
                            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-luxe">Device Type</label>
                        <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="input-luxe">
                            <option value="phone">Phone</option>
                            <option value="smartwatch">Smartwatch</option>
                            <option value="laptop">Laptop</option>
                            <option value="tablet">Tablet</option>
                            <option value="earbuds">Earbuds</option>
                        </select>
                    </div>
                    {mode === 'edit' && (
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-ink" />
                            Active
                        </label>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/admin/models')} className="btn-secondary">
                    <X className="h-4 w-4" /> Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    <Save className="h-4 w-4" /> {saving ? 'Saving…' : mode === 'edit' ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}
