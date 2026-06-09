'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Trash2, ImagePlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { adminCreateProduct, adminUpdateProduct, adminListBrands } from '@/services/adminApi';
import { CATEGORIES, CATEGORY_NAMES, SUBCATEGORY_NAMES, ALL_CATEGORY_NAMES, isDeviceSpecificCategory, getCategoryConfig } from '@/utils/constants';
import api from '@/services/api';

const blank = {
    name: '',
    sku: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    phoneModel: '',
    brand: '',
    image: '',
    images: [],
    stock: 0,
    lowStockThreshold: 5,
    isActive: true,
    isFeatured: false,
    isDeviceSpecific: false,
    tags: [],
    materials: []
};

const normalize = (p) => {
    if (!p) return blank;
    const imgs = Array.isArray(p.images)
        ? p.images.map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean)
        : [];
    return {
        ...blank,
        ...p,
        images: imgs,
        tags: Array.isArray(p.tags) ? p.tags : [],
        materials: Array.isArray(p.materials) ? p.materials : []
    };
};

const numOrUndefined = (v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

function Field({ label, children, error, hint }) {
    return (
        <div>
            <label className="label-luxe">{label}</label>
            {children}
            {hint && !error && <p className="mt-1 text-[11px] text-text-light">{hint}</p>}
            {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
        </div>
    );
}

export default function ProductForm({ initial, mode = 'create' }) {
    const router = useRouter();
    const toast = useToast();
    const [form, setForm] = useState(normalize(initial));
    const [imageUrl, setImageUrl] = useState('');
    const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(', '));
    const fileRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [availableMaterials, setAvailableMaterials] = useState([]);

    useEffect(() => {
        const p = { isActive: 'true' };
        if (form.category) p.category = form.category;
        adminListBrands(p).then(setBrands).catch(() => {});
    }, [form.category]);

    useEffect(() => {
        if (form.category) {
            api.get(`/category-materials/${encodeURIComponent(form.category)}`)
                .then((r) => setAvailableMaterials(r.data?.data || [])).catch(() => setAvailableMaterials([]));
        } else {
            setAvailableMaterials([]);
        }
    }, [form.category]);

    useEffect(() => {
        if (!form.brand) { setModels([]); return; }
        const found = brands.find((b) => b.name === form.brand || String(b.id) === form.brand);
        if (found) {
            const p = {};
            if (form.category) p.category = form.category;
            api.get(`/brands/${found.id}/models`, { params: p }).then((r) => setModels(r.data?.data || [])).catch(() => setModels([]));
        }
    }, [form.brand, brands, form.category]);

    const set = (k) => (e) => {
        const v = e?.target?.type === 'checkbox' ? e.target.checked : e?.target?.value ?? e;
        setForm((f) => ({ ...f, [k]: v }));
    };

    const addImage = () => {
        const u = imageUrl.trim();
        if (!u) return;
        try { new URL(u); } catch { toast.error('Enter a valid URL'); return; }
        if (form.images.includes(u)) { toast.error('Image already added'); return; }
        setForm((f) => ({ ...f, images: [...f.images, u], image: f.image || u }));
        setImageUrl('');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            setForm((f) => ({
                ...f,
                images: [...f.images, dataUrl],
                image: f.image || dataUrl
            }));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeImage = (u) => {
        setForm((f) => ({
            ...f,
            images: f.images.filter((x) => x !== u),
            image: f.image === u ? (f.images.filter((x) => x !== u)[0] || '') : f.image
        }));
    };

    const submit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.name?.trim()) errs.name = 'Required';
        if (!form.description?.trim()) errs.description = 'Required';
        if (!form.category?.trim()) errs.category = 'Required';
        const price = numOrUndefined(form.price);
        if (price === undefined || price < 0) errs.price = 'Enter a valid price';
        setErrors(errs);
        if (Object.keys(errs).length) return;

        const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
        const payload = {
            name: form.name.trim(),
            sku: form.sku?.trim() || undefined,
            description: form.description.trim(),
            price,
            compareAtPrice: numOrUndefined(form.compareAtPrice),
            category: form.category.trim(),
            phoneModel: form.phoneModel?.trim() || undefined,
            brand: form.brand?.trim() || undefined,
            image: form.image || (form.images[0] || undefined),
            images: form.images,
            stock: numOrUndefined(form.stock) ?? 0,
            lowStockThreshold: numOrUndefined(form.lowStockThreshold) ?? 5,
            isActive: !!form.isActive,
            isFeatured: !!form.isFeatured,
            isDeviceSpecific: !!form.isDeviceSpecific,
            materials: Array.isArray(form.materials) ? form.materials : [],
            tags
        };

        setSaving(true);
        try {
            if (mode === 'edit') {
                await adminUpdateProduct(initial.id, payload);
                toast.success('Product updated');
            } else {
                const created = await adminCreateProduct(payload);
                toast.success('Product created');
                router.push(`/admin/products/${created.id}`);
                return;
            }
            router.push('/admin/products');
        } catch (err) {
            const apiErrs = err.response?.data?.errors;
            if (Array.isArray(apiErrs)) {
                const map = {};
                apiErrs.forEach((e) => { const k = (e.path || e.field || '').toString().split('.').pop(); if (k) map[k] = e.message; });
                setErrors(map);
            }
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const categoryConfig = form.category ? getCategoryConfig(form.category) : null;
    const isDeviceCategory = form.category && isDeviceSpecificCategory(form.category);
    const categoryGroup = categoryConfig?.name || null;
    const showDeviceFields = form.isDeviceSpecific && isDeviceCategory;

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="border border-border bg-surface p-5 md:p-6">
                <h3 className="mb-4 font-display text-lg">Basics</h3>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Name *" error={errors.name}>
                        <input value={form.name} onChange={set('name')} className="input-luxe" />
                    </Field>
                    <Field label="SKU" hint="Auto-generated from name if blank" error={errors.sku}>
                        <input value={form.sku} onChange={set('sku')} className="input-luxe" />
                    </Field>
                    <Field label="Category *" error={errors.category} hint={categoryGroup ? `Section: ${categoryGroup}` : 'Select the product category'}>
                        <SearchableSelect
                            value={form.category}
                            onChange={(v) => setForm((f) => ({ ...f, category: v, brand: '', phoneModel: '' }))}
                            options={ALL_CATEGORY_NAMES}
                            placeholder="Select category"
                        />
                    </Field>
                    {isDeviceCategory && (
                        <div className="md:col-span-2">
                            <label className="flex cursor-pointer items-center gap-3 border border-border bg-cream px-4 py-3 hover:border-ink transition-colors">
                                <input type="checkbox" checked={form.isDeviceSpecific}
                                    onChange={(e) => setForm((f) => ({ ...f, isDeviceSpecific: e.target.checked, brand: '', phoneModel: '' }))}
                                    className="h-4 w-4 accent-ink" />
                                <div>
                                    <span className="text-sm font-medium">Device-specific product</span>
                                    <p className="text-[11px] text-text-light">Enable to associate this product with a specific brand and device model</p>
                                </div>
                            </label>
                        </div>
                    )}
                    {showDeviceFields && (
                        <>
                            <Field label="Brand" hint="Device brand" error={errors.brand}>
                                <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value, phoneModel: '' }))} className="input-luxe">
                                    <option value="">Select brand…</option>
                                    {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Compatible Model" hint="Specific device model" error={errors.phoneModel}>
                                <select value={form.phoneModel} onChange={set('phoneModel')} className="input-luxe" disabled={!form.brand}>
                                    <option value="">{form.brand ? 'Select model…' : 'Select brand first'}</option>
                                    {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                                </select>
                            </Field>
                        </>
                    )}
                    {form.category && availableMaterials.length > 0 && (
                        <Field label="Materials" hint="Select one or more materials" error={errors.materials}>
                            <div className="flex flex-wrap gap-1.5">
                                {availableMaterials.map((m) => {
                                    const selected = form.materials?.includes(m.name);
                                    return (
                                        <button key={m.id} type="button" onClick={() => {
                                            setForm((f) => ({
                                                ...f,
                                                materials: selected
                                                    ? f.materials.filter((x) => x !== m.name)
                                                    : [...(f.materials || []), m.name]
                                            }));
                                        }}
                                            className={`px-3 py-1.5 text-xs border transition-colors ${
                                                selected ? 'bg-ink text-cream border-ink' : 'border-border bg-cream text-ink hover:border-ink'
                                            }`}>
                                            {m.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </Field>
                    )}
                    <Field label="Tags" hint="Comma-separated">
                        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="input-luxe" placeholder="bestseller, slim, matte" />
                    </Field>
                </div>
                <div className="mt-5">
                    <Field label="Description *" error={errors.description}>
                        <textarea value={form.description} onChange={set('description')} rows={5} className="input-luxe resize-y" />
                    </Field>
                </div>
            </div>

            <div className="border border-border bg-surface p-5 md:p-6">
                <h3 className="mb-4 font-display text-lg">Pricing & inventory</h3>
                <div className="grid gap-5 md:grid-cols-4">
                    <Field label="Price (INR) *" error={errors.price}>
                        <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} className="input-luxe tabular-nums" />
                    </Field>
                    <Field label="Compare-at price" hint="Show as struck-through" error={errors.compareAtPrice}>
                        <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={set('compareAtPrice')} className="input-luxe tabular-nums" />
                    </Field>
                    <Field label="Stock" error={errors.stock}>
                        <input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} className="input-luxe tabular-nums" />
                    </Field>
                    <Field label="Low-stock threshold" error={errors.lowStockThreshold}>
                        <input type="number" min="0" step="1" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} className="input-luxe tabular-nums" />
                    </Field>
                </div>
                <div className="mt-5 flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4 accent-ink" />
                        Active (visible in shop)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} className="h-4 w-4 accent-ink" />
                        Featured on homepage
                    </label>
                </div>
            </div>

            <div className="border border-border bg-surface p-5 md:p-6">
                <h3 className="mb-4 font-display text-lg">Images</h3>
                <p className="mb-3 text-[11px] text-text-light">Paste an image URL. Backend stores URLs; no file upload.</p>
                <div className="flex flex-wrap gap-2">
                    <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                        placeholder="https://…"
                        className="input-luxe min-w-[260px] flex-1"
                    />
                    <button type="button" onClick={addImage} className="btn-secondary !px-5">
                        <ImagePlus className="h-4 w-4" /> Add URL
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary !px-5">
                        <ImagePlus className="h-4 w-4" /> Upload
                    </button>
                </div>
                {form.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-5">
                        {form.images.map((u) => (
                            <div key={u} className="group relative aspect-square overflow-hidden border border-border bg-background-light">
                                <SmartImage src={u} alt="" fill sizes="200px" className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(u)}
                                    className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center bg-cream text-error shadow group-hover:flex"
                                    aria-label="Remove"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                {form.image === u && (
                                    <span className="absolute bottom-1 left-1 bg-ink px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cream">Primary</span>
                                )}
                                {form.image !== u && (
                                    <button
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, image: u }))}
                                        className="absolute bottom-1 left-1 hidden bg-cream px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-ink shadow group-hover:block"
                                    >Set primary</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => router.push('/admin/products')} className="btn-secondary">
                    <X className="h-4 w-4" /> Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    <Save className="h-4 w-4" /> {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create product'}
                </button>
            </div>
        </form>
    );
}
