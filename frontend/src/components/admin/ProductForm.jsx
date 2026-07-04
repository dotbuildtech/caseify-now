'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Trash2, ImagePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';
import { adminCreateProduct, adminUpdateProduct, adminListBrands } from '@/services/adminApi';
import { CATEGORIES, getCategoryConfig, FORM_FIELD_LABELS, FORM_FIELD_PLACEHOLDERS } from '@/utils/constants';
import api from '@/services/api';
import compressImage from '@/utils/compressImage';
import { fetchFilterOptions } from '@/services/productApi';

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
    tags: [],
    attributes: {}
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
        attributes: p.attributes || {}
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
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [uploadPreview, setUploadPreview] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
    useEffect(() => {
        setTagsInput((initial?.tags || []).join(', '));
    }, [initial?.tags]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [filterOptions, setFilterOptions] = useState({});

    const catConfig = form.category ? getCategoryConfig(form.category) : null;
    const formFields = catConfig?.formFields || [];

    useEffect(() => {
    if (!form.category) {
      setBrands([]);
      setModels([]);
      setFilterOptions({});
      return;
    }
    const p = { isActive: 'true', category: form.category };
    adminListBrands(p).then(setBrands).catch(() => {});
    const attrKeys = catConfig?.attrKeys || [];
    if (attrKeys.length) {
      Promise.all(attrKeys.map((k) => fetchFilterOptions(k).then((opts) => ({ key: k, opts })).catch(() => ({ key: k, opts: [] }))))
        .then((results) => {
          const merged = {};
          results.forEach(({ key, opts }) => { merged[key] = opts; });
          setFilterOptions(merged);
        });
    }
  }, [form.category]);

    useEffect(() => {
        if (!form.brand || !formFields.includes('model')) { setModels([]); return; }
        setModelsLoading(true);
        const found = brands.find((b) => b.name === form.brand || String(b.id) === form.brand);
        if (found) {
            api.get(`/brands/${found.id}/models`, { params: { category: form.category } })
                .then((r) => setModels(r.data?.data || []))
                .catch(() => setModels([]))
                .finally(() => setModelsLoading(false));
        } else {
            setModels([]);
            setModelsLoading(false);
        }
    }, [form.brand, brands, form.category]);

    const set = (k) => (e) => {
        const v = e?.target?.type === 'checkbox' ? e.target.checked : e?.target?.value ?? e;
        setForm((f) => ({ ...f, [k]: v }));
    };

    const setAttr = (key) => (e) => {
        const v = e?.target?.value ?? e;
        setForm((f) => ({ ...f, attributes: { ...f.attributes, [key]: v } }));
    };

    const setCategory = (v) => {
        setForm((f) => ({
            ...f,
            category: v,
            brand: '',
            phoneModel: '',
            attributes: {}
        }));
    };

    const addImage = () => {
        const u = imageUrl.trim();
        if (!u) return;
        try { new URL(u); } catch { toast.error('Enter a valid URL'); return; }
        if (form.images.includes(u)) { toast.error('Image already added'); return; }
        setForm((f) => ({ ...f, images: [...f.images, u], image: f.image || u }));
        setImageUrl('');
    };

    const removeImage = (u) => {
        setForm((f) => ({
            ...f,
            images: f.images.filter((x) => x !== u),
            image: f.image === u ? (f.images.filter((x) => x !== u)[0] || '') : f.image
        }));
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const valid = files.filter((f) => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return false;
            if (f.size > 5 * 1024 * 1024) return false;
            return true;
        });
        if (valid.length === 0) { toast.error('No valid images (max 5MB, jpg/png/webp)'); return; }
        if (valid.length < files.length) toast.error(`${files.length - valid.length} file(s) skipped`);

        setUploading(true);
        setUploadCount({ done: 0, total: valid.length });
        setUploadPreview(URL.createObjectURL(valid[0]));
        try {
            const compressed = await Promise.all(valid.map((f) => compressImage(f, 1000, 0.6)));
            const urls = await Promise.all(compressed.map(async (comp) => {
                const fd = new FormData();
                fd.append('image', comp);
                const r = await api.post('/uploads/image', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUploadCount((c) => ({ ...c, done: c.done + 1 }));
                return r.data?.url;
            }));
            const validUrls = urls.filter(Boolean);
            if (validUrls.length === 0) throw new Error('No URLs returned');
            setForm((f) => ({
                ...f,
                images: [...f.images, ...validUrls],
                image: f.image || validUrls[0]
            }));
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Upload failed');
        } finally {
            setUploading(false);
            setUploadPreview(null);
            setUploadCount({ done: 0, total: 0 });
            e.target.value = '';
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.name?.trim()) errs.name = 'Required';
        if (!form.description?.trim()) errs.description = 'Required';
        if (!form.category?.trim()) errs.category = 'Required';
        const price = numOrUndefined(form.price);
        if (price === undefined || price < 0) errs.price = 'Enter a valid price';
        const compareAtPrice = numOrUndefined(form.compareAtPrice);
        if (compareAtPrice === undefined || compareAtPrice < 0) {
            errs.compareAtPrice = 'Required';
        } else if (price !== undefined && compareAtPrice < price) {
            errs.compareAtPrice = 'Must be ≥ Price';
        }
        setErrors(errs);
        if (Object.keys(errs).length) return;

        const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
        const payload = {
            name: form.name.trim(),
            sku: form.sku?.trim() || undefined,
            description: form.description.trim(),
            price,
            compareAtPrice,
            category: form.category.trim(),
            phoneModel: form.phoneModel?.trim() || undefined,
            brand: form.brand?.trim() || undefined,
            image: form.image || (form.images[0] || undefined),
            images: form.images,
            stock: numOrUndefined(form.stock) ?? 0,
            lowStockThreshold: numOrUndefined(form.lowStockThreshold) ?? 5,
            isActive: !!form.isActive,
            isFeatured: !!form.isFeatured,
            tags,
            attributes: form.attributes || {}
        };
        Object.keys(payload.attributes).forEach((k) => {
            if (!payload.attributes[k]) delete payload.attributes[k];
        });

        setSaving(true);
        try {
            if (mode === 'edit') {
                await adminUpdateProduct(initial.id, payload);
                toast.success('Product updated');
            } else {
                await adminCreateProduct(payload);
                toast.success('Product created');
            }
            setForm({ ...blank });
            setTagsInput('');
            setImageUrl('');
            setErrors({});
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

    const renderFormField = (fieldKey) => {
        if (fieldKey === 'brand') {
            return (
                <Field key="brand" label={FORM_FIELD_LABELS.brand} error={errors.brand}>
                    <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value, phoneModel: '' }))} className="input-luxe">
                        <option value="">{FORM_FIELD_PLACEHOLDERS.brand}</option>
                        {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                </Field>
            );
        }
        if (fieldKey === 'model') {
            return (
                <Field key="model" label={FORM_FIELD_LABELS.model} hint="Select brand first" error={errors.phoneModel}>
                    <select value={form.phoneModel} onChange={set('phoneModel')} className="input-luxe" disabled={!form.brand}>
                        <option value="">{!form.brand ? 'Select brand first' : modelsLoading ? 'Loading...' : FORM_FIELD_PLACEHOLDERS.model}</option>
                        {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                </Field>
            );
        }
        if (fieldKey === 'protectorType' || fieldKey === 'connectorType' || fieldKey === 'chargingSpeed' || fieldKey === 'cableType' || fieldKey === 'cableConnector' || fieldKey === 'earphoneType' || fieldKey === 'capacity') {
            const options = filterOptions[fieldKey] || [];
            const attrValue = form.attributes?.[fieldKey] || '';
            return (
                <Field key={fieldKey} label={FORM_FIELD_LABELS[fieldKey]} error={errors[`attributes.${fieldKey}`]}>
                    <select value={attrValue} onChange={setAttr(fieldKey)} className="input-luxe">
                        <option value="">{FORM_FIELD_PLACEHOLDERS[fieldKey]}</option>
                        {options.map((opt) => <option key={opt.id} value={opt.value}>{opt.label || opt.value}</option>)}
                    </select>
                </Field>
            );
        }
        return null;
    };

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
                    <Field label="Category *" error={errors.category}>
                        <select value={form.category} onChange={(e) => setCategory(e.target.value)} className="input-luxe">
                            <option value="">Select category...</option>
                            {CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </Field>

                    {form.category && formFields.map((f) => renderFormField(f))}

                    <Field label="Tags" hint="Comma-separated">
                        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="input-luxe" placeholder="bestseller, slim, fast-charging" />
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
                    <Field label="MRP / Compare-at price *" hint="Must be ≥ Price. Shows strikethrough & discount badge" error={errors.compareAtPrice}>
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
                <div className="flex flex-wrap gap-2">
                    <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                        placeholder="https://..."
                        className="input-luxe min-w-[260px] flex-1"
                    />
                    <button type="button" onClick={addImage} className="btn-secondary !px-5">
                        <ImagePlus className="h-4 w-4" /> Add URL
                    </button>
                    <label className={`btn-secondary !px-5 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? (uploadCount.total > 1 ? `Uploading ${uploadCount.done}/${uploadCount.total}...` : 'Uploading...') : 'Upload file'}
                        <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    </label>
                </div>
                {uploadPreview && (
                    <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-5">
                        <div className="group relative aspect-square overflow-hidden border border-primary/30 bg-background-light opacity-70">
                            <img src={uploadPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        </div>
                    </div>
                )}
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
                    <Save className="h-4 w-4" /> {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create product'}
                </button>
            </div>
        </form>
    );
}
