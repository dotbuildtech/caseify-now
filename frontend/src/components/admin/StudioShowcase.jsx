'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Loader2, Save, X, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
    adminListBrands,
    adminListStudioBrands,
    adminCreateStudioBrand,
    adminUpdateStudioBrand,
    adminDeleteStudioBrand,
    adminListStudioModels,
    adminCreateStudioModel,
    adminDeleteStudioModel,
    adminGetBrandModels
} from '@/services/adminApi';
import api from '@/services/api';
import compressImage from '@/utils/compressImage';

function useImageUpload() {
    const [uploadingId, setUploadingId] = useState(null);
    const inputRef = useState(null);

    const upload = async (file, onUrl, id = 'default') => {
        if (!file) return;
        setUploadingId(id);
        try {
            const compressed = await compressImage(file, 800, 0.7);
            const form = new FormData();
            form.append('image', compressed);
            const { data } = await api.post('/uploads/studio-image-blob', form);
            if (data?.url) onUrl(data.url);
        } catch {
        } finally {
            setUploadingId(null);
        }
    };

    return { upload, uploadingId };
}

function UploadBtn({ onUpload, uploading, size = 'sm' }) {
    const sz = size === 'sm' ? 'text-[10px] px-2 py-1.5' : 'text-xs px-3 py-2';
    return (
        <label className={`btn-secondary cursor-pointer shrink-0 ${sz}`}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onUpload) onUpload(file);
                e.target.value = '';
            }} />
        </label>
    );
}

export default function StudioShowcase() {
    const toast = useToast();
    const { upload, uploadingId } = useImageUpload();

    const [allBrands, setAllBrands] = useState([]);
    const [studioBrands, setStudioBrands] = useState([]);
    const [studioModels, setStudioModels] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedBrand, setExpandedBrand] = useState(null);
    const [showAddBrand, setShowAddBrand] = useState(false);

    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [newLogo, setNewLogo] = useState('');
    const [newModelName, setNewModelName] = useState('');
    const [newModelImage, setNewModelImage] = useState('');
    const [addingModelTo, setAddingModelTo] = useState(null);
    const [brandDeviceModels, setBrandDeviceModels] = useState({});

    const getDeviceModelsForBrand = async (brandId) => {
        if (brandDeviceModels[brandId]) return brandDeviceModels[brandId];
        try {
            const models = await adminGetBrandModels(brandId);
            setBrandDeviceModels(prev => ({ ...prev, [brandId]: models }));
            return models;
        } catch { return []; }
    };

    const loadData = async () => {
        try {
            const [brands, sBrands] = await Promise.all([
                adminListBrands({ isActive: true }),
                adminListStudioBrands()
            ]);
            setAllBrands(brands);
            setStudioBrands(sBrands);
            const modelMap = {};
            await Promise.all(sBrands.map(async (sb) => {
                const models = await adminListStudioModels({ studioBrandId: sb.id });
                modelMap[sb.id] = models;
            }));
            setStudioModels(modelMap);
        } catch { toast.error('Failed to load data'); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleAddStudioBrand = async () => {
        if (!selectedBrandId) { toast.error('Select a brand'); return; }
        if (studioBrands.some(sb => sb.Brand?.id === Number(selectedBrandId))) {
            toast.error('Brand already added');
            return;
        }
        setSaving(true);
        try {
            const result = await adminCreateStudioBrand({ brandId: Number(selectedBrandId), logo: newLogo || null, showOnStudio: true });
            const sb = { ...result, Brand: allBrands.find(b => b.id === Number(selectedBrandId)) };
            setStudioBrands(prev => [...prev, sb]);
            setStudioModels(prev => ({ ...prev, [sb.id]: [] }));
            setSelectedBrandId('');
            setNewLogo('');
            setShowAddBrand(false);
            toast.success('Brand added');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
    };

    const handleToggleBrand = async (sb) => {
        try {
            const updated = await adminUpdateStudioBrand(sb.id, { showOnStudio: !sb.showOnStudio });
            setStudioBrands(prev => prev.map(b => b.id === sb.id ? { ...b, showOnStudio: updated.showOnStudio } : b));
        } catch { toast.error('Toggle failed'); }
    };

    const handleDeleteBrand = async (sb) => {
        if (!confirm(`Remove "${sb.Brand?.name}" from studio?`)) return;
        try {
            await adminDeleteStudioBrand(sb.id);
            setStudioBrands(prev => prev.filter(b => b.id !== sb.id));
            const nm = { ...studioModels };
            delete nm[sb.id];
            setStudioModels(nm);
            toast.success('Brand removed');
        } catch { toast.error('Delete failed'); }
    };

    const handleUpdateLogo = async (sb, url) => {
        try {
            const updated = await adminUpdateStudioBrand(sb.id, { logo: url });
            setStudioBrands(prev => prev.map(b => b.id === sb.id ? { ...b, logo: updated.logo } : b));
        } catch { toast.error('Update failed'); }
    };

    const handleAddModel = async (studioBrandId) => {
        if (!newModelName.trim()) { toast.error('Model name is required'); return; }
        setSaving(true);
        try {
            const result = await adminCreateStudioModel({
                studioBrandId,
                name: newModelName.trim(),
                image: newModelImage || null,
                showOnStudio: true
            });
            setStudioModels(prev => ({ ...prev, [studioBrandId]: [...(prev[studioBrandId] || []), result] }));
            setNewModelName('');
            setNewModelImage('');
            setAddingModelTo(null);
            toast.success('Model added');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
    };

    const handleDeleteModel = async (m) => {
        if (!confirm(`Delete "${m.name}"?`)) return;
        try {
            await adminDeleteStudioModel(m.id);
            setStudioModels(prev => ({ ...prev, [m.studioBrandId]: (prev[m.studioBrandId] || []).filter(x => x.id !== m.id) }));
            toast.success('Model deleted');
        } catch { toast.error('Delete failed'); }
    };

    const handleUpdateModelImage = async (m, url) => {
        try {
            const { adminUpdateStudioModel } = await import('@/services/adminApi');
            await adminUpdateStudioModel(m.id, { image: url });
            setStudioModels(prev => ({
                ...prev,
                [m.studioBrandId]: (prev[m.studioBrandId] || []).map(x => x.id === m.id ? { ...x, image: url } : x)
            }));
        } catch { /* silent */ }
    };

    if (loading) return <div className="h-32 bg-background-light animate-pulse" />;

    const availableBrands = allBrands.filter(b => !studioBrands.some(sb => sb.Brand?.id === b.id));

    return (
        <div className="border border-border bg-surface p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="font-display text-lg">Brands &amp; Models</h3>
                    <p className="mt-0.5 text-xs text-text-light">Manage which brands and models appear in the design studio.</p>
                </div>
                <button onClick={() => setShowAddBrand(!showAddBrand)}
                    className="btn-primary text-sm">
                    <Plus className="h-4 w-4" /> Add Brand/Model+
                </button>
            </div>

            {showAddBrand && (
                <div className="mb-6 rounded-lg border border-border bg-background/50 p-4">
                    <h4 className="mb-3 text-sm font-medium flex items-center gap-2"><Plus className="h-3.5 w-3.5 text-bronze" /> Add Brand to Studio</h4>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[180px] flex-1">
                            <label className="label-luxe text-[10px]">Brand</label>
                            <select value={selectedBrandId} onChange={(e) => {
                                setSelectedBrandId(e.target.value);
                                const brand = allBrands.find(b => b.id === Number(e.target.value));
                                if (brand) setNewLogo(brand.logo || '');
                            }} className="input-luxe text-sm">
                                <option value="">Select a brand...</option>
                                {availableBrands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-[180px] flex-[2]">
                            <label className="label-luxe text-[10px]">Logo (URL)</label>
                            <div className="flex gap-1.5">
                                <input type="text" value={newLogo} onChange={(e) => setNewLogo(e.target.value)}
                                    className="input-luxe flex-1 text-sm" placeholder="Paste URL or upload..." />
                                <UploadBtn onUpload={(file) => upload(file, (url) => setNewLogo(url), 'new-logo')}
                                    uploading={uploadingId === 'new-logo'} size="md" />
                            </div>
                            {newLogo && <img src={newLogo} alt="" className="mt-1.5 h-10 w-10 rounded object-contain border border-border" />}
                        </div>
                        <button type="button" onClick={handleAddStudioBrand} disabled={saving || !selectedBrandId}
                            className="btn-primary text-sm whitespace-nowrap disabled:opacity-50 h-10">
                            <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                    </div>
                </div>
            )}

            {studioBrands.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-sm text-text-light">No brands added yet.</p>
                    <p className="mt-1 text-[10px] text-text-light">Click "Add Brand/Model+" to get started.</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {studioBrands.map(sb => (
                        <div key={sb.id} className="rounded-lg border border-border overflow-hidden transition-shadow hover:shadow-sm">
                            <div className="flex items-center gap-3 bg-background-light/50 px-4 py-3">
                                <button onClick={() => setExpandedBrand(expandedBrand === sb.id ? null : sb.id)}
                                    className="text-text-light hover:text-foreground">
                                    {expandedBrand === sb.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-white flex items-center justify-center">
                                    {sb.logo ? <img src={sb.logo} alt="" className="h-full w-full object-contain p-1" /> : (
                                        <span className="text-lg font-bold text-text-light">{sb.Brand?.name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{sb.Brand?.name || 'Unknown'}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <input type="text" value={sb.logo || ''}
                                            onChange={(e) => handleUpdateLogo(sb, e.target.value)}
                                            className="input-luxe text-[10px] py-1 px-2 flex-1 max-w-[220px]" placeholder="Logo URL..." />
                                        <UploadBtn onUpload={(file) => upload(file, (url) => handleUpdateLogo(sb, url), `logo-${sb.id}`)}
                                            uploading={uploadingId === `logo-${sb.id}`} size="sm" />
                                    </div>
                                </div>
                                <button onClick={() => handleToggleBrand(sb)}
                                    className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded border transition-colors ${sb.showOnStudio ? 'bg-success/10 border-success/30 text-success' : 'bg-background border-border text-text-light'}`}>
                                    {sb.showOnStudio ? <><Eye className="h-3 w-3" /> Visible</> : <><EyeOff className="h-3 w-3" /> Hidden</>}
                                </button>
                                <span className="text-xs text-text-light">{(studioModels[sb.id] || []).length} models</span>
                                <button onClick={() => handleDeleteBrand(sb)} className="text-error/60 hover:text-error p-1">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {expandedBrand === sb.id && (
                                <div className="border-t border-border px-4 py-3 space-y-2 bg-white/50 max-h-[350px] overflow-y-auto">
                                    {(studioModels[sb.id] || []).length === 0 && !addingModelTo ? (
                                        <p className="text-[10px] text-text-light py-1">No models added.</p>
                                    ) : (
                                        (studioModels[sb.id] || []).map(m => (
                                            <div key={m.id} className="flex items-center gap-2 rounded border border-border bg-white p-2">
                                                {m.image ? (
                                                    <img src={m.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover border border-border" />
                                                ) : (
                                                    <div className="h-9 w-9 shrink-0 rounded bg-background-light border border-border flex items-center justify-center text-[9px] text-text-light">No img</div>
                                                )}
                                                <span className="min-w-0 flex-1 text-xs truncate font-medium">{m.name}</span>
                                                <input type="text" defaultValue={m.image || ''}
                                                    onBlur={(e) => { if (e.target.value !== m.image) handleUpdateModelImage(m, e.target.value); }}
                                                    className="w-20 border border-border rounded px-1.5 py-1 text-[9px] bg-transparent outline-none focus:border-ink hidden md:block" placeholder="Image URL..." />
                                                <UploadBtn onUpload={(file) => upload(file, (url) => handleUpdateModelImage(m, url), `mi-${m.id}`)}
                                                    uploading={uploadingId === `mi-${m.id}`} size="sm" />
                                                <button onClick={() => handleDeleteModel(m)} className="text-error/60 hover:text-error p-0.5">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))
                                    )}

                                    {addingModelTo === sb.id ? (
                                        <div className="rounded border border-border bg-background-light/50 p-3 space-y-2">
                                            <div className="flex gap-2">
                                                <select value={newModelName} onChange={(e) => setNewModelName(e.target.value)}
                                                    className="input-luxe flex-1 text-xs" autoFocus>
                                                    <option value="">Select a model...</option>
                                                    {(brandDeviceModels[sb.brandId] || [])
                                                        .filter(dm => !(studioModels[sb.id] || []).some(sm => sm.name === dm.name))
                                                        .map(dm => (
                                                            <option key={dm.id} value={dm.name}>{dm.name}</option>
                                                        ))}
                                                </select>
                                                {newModelName && (
                                                    <input type="text" value={newModelName}
                                                        onChange={(e) => setNewModelName(e.target.value)}
                                                        className="input-luxe w-24 text-[9px]" placeholder="Or type..." />
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex gap-1.5">
                                                    <input type="text" value={newModelImage} onChange={(e) => setNewModelImage(e.target.value)}
                                                        className="input-luxe flex-1 text-xs" placeholder="Image URL..." />
                                                    <UploadBtn onUpload={(file) => upload(file, (url) => setNewModelImage(url), 'new-mi')}
                                                        uploading={uploadingId === 'new-mi'} size="sm" />
                                                </div>
                                                <button onClick={() => handleAddModel(sb.id)}
                                                    disabled={saving || !newModelName.trim()}
                                                    className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50 whitespace-nowrap">
                                                    <Save className="h-3 w-3" /> Add
                                                </button>
                                                <button onClick={() => { setAddingModelTo(null); setNewModelName(''); setNewModelImage(''); }}
                                                    className="btn-secondary text-xs px-3 py-1.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                            {newModelImage && <img src={newModelImage} alt="" className="h-10 w-10 rounded object-cover border border-border" />}
                                        </div>
                                    ) : (
                                        <button onClick={async () => {
                                            setNewModelName('');
                                            setNewModelImage('');
                                            setAddingModelTo(sb.id);
                                            await getDeviceModelsForBrand(sb.brandId);
                                        }}
                                            className="flex items-center gap-1 text-xs text-bronze hover:text-bronze/80 py-1">
                                            <Plus className="h-3 w-3" /> Add Model
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}