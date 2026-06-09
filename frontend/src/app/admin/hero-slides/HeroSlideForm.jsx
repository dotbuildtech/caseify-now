'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, ImagePlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

export default function HeroSlideForm({ mode, initial }) {
    const router = useRouter();
    const toast = useToast();
    const fileRef = useRef(null);
    const [title, setTitle] = useState(initial?.title || '');
    const [subtitle, setSubtitle] = useState(initial?.subtitle || '');
    const [ctaText, setCtaText] = useState(initial?.ctaText || 'Shop Now');
    const [ctaLink, setCtaLink] = useState(initial?.ctaLink || '/shop');
    const [bg, setBg] = useState(initial?.bg || '');
    const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
    const [isActive, setIsActive] = useState(initial?.isActive !== false);
    const [bgFile, setBgFile] = useState(null);
    const [preview, setPreview] = useState(initial?.bg || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
        setBgFile(file);
        setPreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required'); return; }
        setSaving(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('subtitle', subtitle.trim());
            formData.append('ctaText', ctaText.trim());
            formData.append('ctaLink', ctaLink.trim());
            formData.append('sortOrder', String(sortOrder));
            formData.append('isActive', String(isActive));
            if (bgFile) {
                formData.append('bg', bgFile);
            } else if (bg && bg !== preview && !bgFile) {
                formData.append('bg', bg);
            }

            if (mode === 'edit') {
                await api.put(`/hero-slides/${initial.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Slide updated');
            } else {
                await api.post('/hero-slides', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Slide created');
            }
            router.push('/admin/hero-slides');
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const clearImage = () => {
        setBgFile(null);
        setPreview('');
        setBg('');
    };

    return (
        <form onSubmit={submit} className="space-y-6 max-w-xl">
            <div className="border border-border bg-surface p-5 md:p-6">
                <h3 className="mb-4 font-display text-lg">{mode === 'edit' ? 'Edit' : 'New'} Hero Slide</h3>
                {error && <p className="mb-3 text-sm text-error">{error}</p>}
                <div className="space-y-5">
                    <div>
                        <label className="label-luxe">Title *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)}
                            className="input-luxe" placeholder="e.g. Protect Your Device" />
                    </div>
                    <div>
                        <label className="label-luxe">Subtitle</label>
                        <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                            rows={2} className="input-luxe resize-y"
                            placeholder="e.g. Premium phone cases and accessories with latest designs." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-luxe">CTA Text</label>
                            <input value={ctaText} onChange={(e) => setCtaText(e.target.value)}
                                className="input-luxe" placeholder="Shop Now" />
                        </div>
                        <div>
                            <label className="label-luxe">CTA Link</label>
                            <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)}
                                className="input-luxe" placeholder="/shop" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-luxe">Sort Order</label>
                            <input type="number" min="0" value={sortOrder}
                                onChange={(e) => setSortOrder(Number(e.target.value))}
                                className="input-luxe tabular-nums" />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="h-4 w-4 accent-ink" />
                                Active
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="label-luxe">Background Image</label>
                        <p className="mb-2 text-[11px] text-text-light">Upload a hero image (recommended 1920x1080, max 5MB, jpg/png/webp)</p>
                        <div className="flex flex-wrap gap-2">
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="btn-secondary !px-5">
                                <ImagePlus className="h-4 w-4" /> Upload Image
                            </button>
                            {!bgFile && (
                                <input value={bg} onChange={(e) => { setBg(e.target.value); setPreview(e.target.value); }}
                                    placeholder="Or paste image URL..."
                                    className="input-luxe flex-1 min-w-[200px]" />
                            )}
                        </div>
                        {preview && (
                            <div className="relative mt-3">
                                <div className="relative aspect-[16/7] overflow-hidden border border-border bg-background-light max-w-lg">
                                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                                <button type="button" onClick={clearImage}
                                    className="mt-2 text-[11px] text-error hover:underline">
                                    Remove image
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/admin/hero-slides')} className="btn-secondary">
                    <X className="h-4 w-4" /> Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    <Save className="h-4 w-4" /> {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create slide'}
                </button>
            </div>
        </form>
    );
}
