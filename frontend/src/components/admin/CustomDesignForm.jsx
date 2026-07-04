'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Upload, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminCreateCustomDesign, adminUpdateCustomDesign, adminListStudioModels } from '@/services/adminApi';
import api from '@/services/api';
import compressImage from '@/utils/compressImage';

export default function CustomDesignForm({ mode = 'create', initial = null }) {
    const router = useRouter();
    const toast = useToast();
    const isEdit = mode === 'edit';

    const [name, setName] = useState(initial?.name || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [modelSlug, setModelSlug] = useState(initial?.modelSlug || '');
    const [image, setImage] = useState(initial?.image || '');
    const [price, setPrice] = useState(initial?.price ?? '');
    const [compareAtPrice, setCompareAtPrice] = useState(initial?.compareAtPrice ?? '');
    const [isActive, setIsActive] = useState(initial?.isActive !== false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [studioModels, setStudioModels] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const models = await adminListStudioModels();
                setStudioModels(models || []);
            } catch { setStudioModels([]); }
        })();
    }, []);

    const handleImageUpload = async (file) => {
        if (!file) return;
        const localUrl = URL.createObjectURL(file);
        setImage(localUrl);
        setUploading(true);
        try {
            const compressed = await compressImage(file, 800, 0.75);
            const form = new FormData();
            form.append('image', compressed);
            const { data } = await api.post('/uploads/studio-image-blob', form);
            if (data?.url) {
                setImage(data.url);
                URL.revokeObjectURL(localUrl);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Image upload failed');
            setImage('');
        } finally { setUploading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Name is required'); return; }
        if (!modelSlug) { toast.error('Select a model'); return; }
        if (!image) { toast.error('Upload an image'); return; }
        if (!price) { toast.error('Price is required'); return; }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim() || null,
                modelSlug,
                image,
                price: Number(price),
                compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
                isActive
            };
            if (isEdit) {
                await adminUpdateCustomDesign(initial.id, payload);
                toast.success('Design updated');
            } else {
                await adminCreateCustomDesign(payload);
                toast.success('Design created');
            }
            router.push('/admin/custom-designs');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="border border-border bg-surface p-5 md:p-6 space-y-5">
                <h3 className="font-display text-lg">{isEdit ? 'Edit' : 'New'} Custom Design</h3>

                <div>
                    <label className="label-luxe text-[10px]">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="input-luxe text-sm" placeholder="e.g. Galaxy Gradient" />
                </div>

                <div>
                    <label className="label-luxe text-[10px]">Model</label>
                    <select value={modelSlug} onChange={(e) => setModelSlug(e.target.value)}
                        className="input-luxe text-sm">
                        <option value="">Select a model...</option>
                        {studioModels.map(m => {
                            const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            return <option key={m.id} value={slug}>{m.name}</option>;
                        })}
                    </select>
                </div>

                <div>
                    <label className="label-luxe text-[10px]">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        className="input-luxe text-sm min-h-[80px]" placeholder="Optional description..." />
                </div>

                <div>
                    <label className="label-luxe text-[10px]">Design Image</label>
                    <div className="flex items-start gap-3">
                        {image ? (
                            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border shadow-sm">
                                <img src={image} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => setImage('')}
                                    className="absolute top-0.5 right-0.5 bg-error/80 text-white rounded-full p-0.5 z-10">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-28 w-28 shrink-0 rounded-lg border-2 border-dashed border-border bg-background-light flex items-center justify-center">
                                <Upload className="h-6 w-6 mx-auto text-text-light/50" />
                            </div>
                        )}
                        <label className="btn-primary cursor-pointer text-xs inline-flex w-fit">
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                                e.target.value = '';
                            }} />
                        </label>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="label-luxe text-[10px]">Price (₹)</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                            className="input-luxe text-sm" placeholder="399" min="0" />
                    </div>
                    <div>
                        <label className="label-luxe text-[10px]">Compare at Price (₹)</label>
                        <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)}
                            className="input-luxe text-sm" placeholder="599" min="0" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="label-luxe text-[10px] mb-0">Active</label>
                    <button type="button" onClick={() => setIsActive(!isActive)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-success' : 'bg-border'}`}>
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={saving}
                    className="btn-primary text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEdit ? 'Update' : 'Create'} Design
                </button>
                <button type="button" onClick={() => router.back()}
                    className="btn-secondary text-sm">Cancel</button>
            </div>
        </form>
    );
}