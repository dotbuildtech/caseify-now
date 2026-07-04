'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
    adminListStudioBrands,
    adminListStudioModels,
    adminListMaterials,
    adminCreateStudioProduct,
    adminUpdateStudioProduct,
    adminSaveFullTemplate,
    adminGetTemplateByProductId
} from '@/services/adminApi';
import api from '@/services/api';
import compressImage from '@/utils/compressImage';
import TemplateEditor from '@/components/template-editor/TemplateEditor';

export default function StudioProductForm({ product = null }) {
    const router = useRouter();
    const toast = useToast();
    const isEdit = !!product;

    const [studioBrands, setStudioBrands] = useState([]);
    const [studioModels, setStudioModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);

    const [studioBrandId, setStudioBrandId] = useState(product?.studioBrandId || '');
    const [studioModelId, setStudioModelId] = useState(product?.studioModelId || '');
    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [image, setImage] = useState(product?.image || '');
    const [price, setPrice] = useState(product?.price || '');
    const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice || '');
    const [materialId, setMaterialId] = useState(product?.materialId || '');
    const [isActive, setIsActive] = useState(product?.isActive !== false);

    const [editableAreas, setEditableAreas] = useState([]);
    const [templateLoaded, setTemplateLoaded] = useState(false);
    const [actualImageWidth, setActualImageWidth] = useState(3000);
    const [actualImageHeight, setActualImageHeight] = useState(3000);

    useEffect(() => {
        (async () => {
            try {
                const [brands, models, mats] = await Promise.all([
                    adminListStudioBrands(),
                    adminListStudioModels(),
                    adminListMaterials({ isActive: true })
                ]);
                setStudioBrands(brands);
                setStudioModels(models);
                setMaterials(mats);
            } catch {
                toast.error('Failed to load form data');
            }
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (studioBrandId) {
            setFilteredModels(studioModels.filter(m => m.studioBrandId === Number(studioBrandId)));
        } else {
            setFilteredModels([]);
        }
    }, [studioBrandId, studioModels]);

    useEffect(() => {
        if (isEdit && product?.id && !templateLoaded) {
            (async () => {
                setLoadingTemplate(true);
                try {
                    const template = await adminGetTemplateByProductId(product.id);
                    if (template?.editableAreas) {
                        setEditableAreas(template.editableAreas);
                        if (template.templateImage) {
                            setImage(template.templateImage);
                        }
                        setTemplateLoaded(true);
                    }
                } catch {
                    // No template yet for this product
                } finally {
                    setLoadingTemplate(false);
                }
            })();
        }
    }, [isEdit, product?.id, templateLoaded]);

    const handleImageUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setUploadPreview(URL.createObjectURL(file));
        try {
            const compressed = await compressImage(file, 1200, 0.9);
            const form = new FormData();
            form.append('image', compressed);
            const { data } = await api.post('/uploads/studio-image-blob', form);
            if (data?.url) {
                setImage(data.url);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Image upload failed');
        } finally {
            setUploading(false);
            setUploadPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!studioBrandId) { toast.error('Select a studio brand'); return; }
        if (!studioModelId) { toast.error('Select a studio model'); return; }
        if (!name.trim()) { toast.error('Product name is required'); return; }
        if (!image) { toast.error('Upload a product image'); return; }
        if (!price) { toast.error('Price is required'); return; }

        setSaving(true);
        try {
            const payload = {
                studioBrandId: Number(studioBrandId),
                studioModelId: Number(studioModelId),
                name: name.trim(),
                description: description.trim() || null,
                image,
                price: Number(price),
                compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
                materialId: materialId ? Number(materialId) : null,
                isActive
            };

            let savedProduct;
            if (isEdit) {
                savedProduct = await adminUpdateStudioProduct(product.id, payload);
            } else {
                savedProduct = await adminCreateStudioProduct(payload);
            }

            const productId = savedProduct?.id || product?.id;

            if (image && editableAreas.length > 0 && productId) {
                await adminSaveFullTemplate({
                    studioProductId: productId,
                    templateImage: image,
                    originalWidth: actualImageWidth,
                    originalHeight: actualImageHeight,
                    editableAreas: editableAreas.map((a) => ({
                        name: a.name,
                        areaType: a.areaType,
                        shapeType: a.shapeType,
                        x: a.x,
                        y: a.y,
                        width: a.width,
                        height: a.height,
                        rotation: a.rotation || 0,
                        borderRadius: a.borderRadius ?? 0,
                        borderRadiusTop: a.borderRadiusTop ?? 0,
                        borderRadiusBottom: a.borderRadiusBottom ?? 0,
                        minZoom: a.minZoom,
                        maxZoom: a.maxZoom,
                        allowRotation: a.allowRotation,
                        allowFlip: a.allowFlip,
                        lockAspectRatio: a.lockAspectRatio,
                        isRequired: a.isRequired,
                        isVisible: a.isVisible,
                        isEnabled: a.isEnabled,
                        placeholderImage: a.placeholderImage || null,
                        maxUploadSize: a.maxUploadSize,
                        acceptedFileTypes: a.acceptedFileTypes,
                        zIndex: a.zIndex,
                        opacity: a.opacity,
                        notes: a.notes || null,
                        sortOrder: a.sortOrder,
                        polygonSides: a.polygonSides ?? null,
                        pathData: a.pathData || null,
                    }))
                });
            }

            toast.success(isEdit ? 'Product updated' : 'Product created');
            router.push('/admin/custom-designs/products');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-64 bg-background-light animate-pulse" />;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Info Section */}
            <div className="border border-border bg-surface p-5 md:p-6 space-y-5 max-w-2xl">
                <h3 className="font-display text-lg">{isEdit ? 'Edit' : 'New'} Studio Product</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="label-luxe text-[10px]">Studio Brand</label>
                        <select value={studioBrandId} onChange={(e) => { setStudioBrandId(e.target.value); setStudioModelId(''); }}
                            className="input-luxe text-sm">
                            <option value="">Select brand...</option>
                            {studioBrands.map(sb => (
                                <option key={sb.id} value={sb.id}>{sb.Brand?.name || `Brand #${sb.brandId}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label-luxe text-[10px]">Studio Model</label>
                        <select value={studioModelId} onChange={(e) => setStudioModelId(e.target.value)}
                            className="input-luxe text-sm">
                            <option value="">Select model...</option>
                            {filteredModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label-luxe text-[10px]">Product Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="input-luxe text-sm" placeholder="e.g. iPhone 16 Pro Glossy Case" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="label-luxe text-[10px]">Price ({'\u20B9'})</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                            className="input-luxe text-sm" placeholder="399" min="0" />
                    </div>
                    <div>
                        <label className="label-luxe text-[10px]">Compare at Price ({'\u20B9'})</label>
                        <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)}
                            className="input-luxe text-sm" placeholder="599" min="0" />
                    </div>
                </div>

                <div>
                    <label className="label-luxe text-[10px]">Material</label>
                    <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}
                        className="input-luxe text-sm">
                        <option value="">Select material...</option>
                        {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label-luxe text-[10px]">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        className="input-luxe text-sm min-h-[100px]" placeholder="Product description..." />
                </div>

                <div className="flex items-center gap-3">
                    <label className="label-luxe text-[10px] mb-0">Active</label>
                    <button type="button" onClick={() => setIsActive(!isActive)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-success' : 'bg-border'}`}>
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Template PNG Upload + Editor Section */}
            <div className="border border-border bg-surface overflow-hidden">
                <div className="p-5 md:p-6 border-b border-border bg-background-light/30">
                    <h3 className="font-display text-sm mb-3">Template Design</h3>
                    <div className="flex items-start gap-3">
                        {uploadPreview ? (
                            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-primary/30 shadow-sm opacity-70">
                                <img src={uploadPreview} alt="" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            </div>
                        ) : image ? (
                            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border shadow-sm">
                                <img src={image} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => { setImage(''); setEditableAreas([]); }}
                                    className="absolute top-0.5 right-0.5 bg-error/80 text-white rounded-full p-0.5 z-10">
                                    <X className="h-3 w-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5 font-medium">
                                    Template PNG
                                </div>
                            </div>
                        ) : (
                            <div className="h-28 w-28 shrink-0 rounded-lg border-2 border-dashed border-border bg-background-light flex items-center justify-center">
                                <div className="text-center">
                                    <Upload className="h-6 w-6 mx-auto text-text-light/50" />
                                    <p className="text-[9px] text-text-light/50 mt-1">No PNG</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <label className="btn-primary cursor-pointer text-xs inline-flex w-fit">
                                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                <span>{uploading ? 'Uploading...' : 'Upload Template PNG'}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file);
                                    e.target.value = '';
                                }} />
                            </label>
                            {image && (
                                <p className="text-[10px] text-text-light/70">
                                    {editableAreas.length > 0 ? `${editableAreas.length} editable area(s) defined` : 'No editable areas yet'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {image && (
                    <div>
                        <TemplateEditor
                            imageUrl={image}
                            initialAreas={editableAreas.length > 0 ? editableAreas : undefined}
                            onAreasChange={setEditableAreas}
                            originalWidth={actualImageWidth}
                            originalHeight={actualImageHeight}
                            onImageDimensions={(w, h) => { setActualImageWidth(w); setActualImageHeight(h); }}
                        />
                    </div>
                )}

                {!image && (
                    <div className="p-8 text-center">
                        <Upload className="h-8 w-8 mx-auto text-text-light/30 mb-2" />
                        <p className="text-sm text-text-light">Upload a template PNG to define editable regions</p>
                        <p className="text-xs text-text-light/60 mt-1">Customers will customize inside these regions</p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={saving}
                    className="btn-primary text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEdit ? 'Update' : 'Create'} Product
                </button>
                <button type="button" onClick={() => router.back()}
                    className="btn-secondary text-sm">
                    Cancel
                </button>
            </div>
        </form>
    );
}
