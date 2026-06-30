'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminListTemplates, adminDeleteTemplate, adminListBrands, adminListDeviceModels, adminCreateTemplate, adminUpdateTemplate, adminImportModelsCSV } from '@/services/adminApi';
import { formatDate } from '@/utils/format';

export default function AdminTemplatesPage() {
    const toast = useToast();
    const [templates, setTemplates] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [editModal, setEditModal] = useState(null);
    const [csvModal, setCsvModal] = useState(false);
    const [csvText, setCsvText] = useState('');
    const [importResult, setImportResult] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminListTemplates({ page, search, limit: 20 });
            setTemplates(res?.data || []);
            setTotal(res?.total || 0);
        } catch (e) { toast.error('Failed to load templates'); }
        finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        adminListBrands().then(b => setBrands(Array.isArray(b) ? b : [])).catch(() => {});
    }, []);

    const del = async (tpl) => {
        if (!confirm(`Delete template for model #${tpl.deviceModelId}?`)) return;
        try { await adminDeleteTemplate(tpl.id); toast.success('Template deleted'); load(); }
        catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
    };

    const handleBrandChange = async (brandId) => {
        if (!brandId) return setModels([]);
        try {
            const res = await adminListDeviceModels({ brandId });
            setModels(Array.isArray(res) ? res : (res?.data || []));
        } catch { setModels([]); }
    };

    const save = async (form) => {
        try {
            if (form.id) {
                await adminUpdateTemplate(form.id, form);
                toast.success('Template updated');
            } else {
                await adminCreateTemplate(form);
                toast.success('Template created');
            }
            setEditModal(null);
            load();
        } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    };

    const handleCsvImport = async () => {
        const lines = csvText.trim().split('\n').filter(Boolean);
        const rows = lines.slice(1).map(line => {
            const [Brand, Model, ReleaseYear] = line.split(',').map(s => s.trim());
            return { Brand, Model, ReleaseYear };
        });
        if (rows.length === 0) { toast.error('No valid rows found'); return; }
        try {
            const res = await adminImportModelsCSV(rows);
            setImportResult(res);
            toast.success(`Imported: ${res.created} created, ${res.skipped} skipped`);
            load();
        } catch (e) { toast.error('Import failed'); }
    };

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl">Device Templates</h2>
                    <p className="mt-1 text-xs text-text-light">{loading ? 'Loading…' : `${total} templates`}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCsvModal(true)} className="btn-outline flex items-center gap-1.5 text-xs">
                        <Upload className="h-3.5 w-3.5" /> CSV Import
                    </button>
                    <button onClick={() => setEditModal({ deviceModelId: '', caseWidth: '', caseHeight: '', safeAreaTop: 0, safeAreaBottom: 0, safeAreaLeft: 0, safeAreaRight: 0, bleedArea: 0, cornerRadius: 0, cameraX: 0, cameraY: 0, cameraWidth: 0, cameraHeight: 0, basePrice: 399 })} className="btn-primary flex items-center gap-1.5 text-xs">
                        <Plus className="h-3.5 w-3.5" /> New Template
                    </button>
                </div>
            </div>

            <div className="flex items-center border border-border bg-surface px-3 focus-within:border-ink">
                <Search className="h-4 w-4 text-text-light" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by model name…" className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-text-light" />
            </div>

            <div className="border border-border bg-surface overflow-x-auto">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
                            <div className="h-4 w-32 animate-pulse bg-background-light" />
                            <div className="h-4 w-20 animate-pulse bg-background-light" />
                            <div className="ml-auto h-4 w-16 animate-pulse bg-background-light" />
                        </div>
                    ))
                ) : templates.length === 0 ? (
                    <div className="p-8 text-center text-sm text-text-light">No templates yet.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-border text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">
                            <tr>
                                <th className="px-4 py-3 text-left">ID</th>
                                <th className="px-4 py-3 text-left">Model</th>
                                <th className="px-4 py-3 text-left">Brand</th>
                                <th className="px-4 py-3 text-left">Dimensions</th>
                                <th className="px-4 py-3 text-left">Base Price</th>
                                <th className="px-4 py-3 text-left">Active</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {templates.map((t) => (
                                <tr key={t.id} className="hover:bg-background-light/50">
                                    <td className="px-4 py-3 font-mono text-xs text-text-light">#{t.id}</td>
                                    <td className="px-4 py-3 font-medium">{t.model?.name || `Model #${t.deviceModelId}`}</td>
                                    <td className="px-4 py-3 text-text-light">{t.model?.Brands?.name || '—'}</td>
                                    <td className="px-4 py-3 text-text-light">{t.caseWidth}×{t.caseHeight}</td>
                                    <td className="px-4 py-3">₹{t.basePrice}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block h-2 w-2 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                    </td>
                                    <td className="px-4 py-3 text-xs text-text-light">{formatDate(t.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => setEditModal(t)} className="rounded p-1.5 text-text-light hover:bg-background-light hover:text-ink">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => del(t)} className="rounded p-1.5 text-text-light hover:bg-background-light hover:text-error">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {total > 20 && (
                    <div className="flex items-center justify-between border-t border-border p-4">
                        <p className="text-xs text-text-light">Page {page} of {Math.ceil(total / 20)}</p>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline text-xs">Previous</button>
                            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="btn-outline text-xs">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {editModal && <TemplateFormModal template={editModal} brands={brands} models={models} templates={templates} onBrandChange={handleBrandChange} onSave={save} onClose={() => setEditModal(null)} />}
            {csvModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setCsvModal(false); setImportResult(null); }}>
                    <div className="w-full max-w-lg border border-border bg-surface p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-display text-lg">CSV Import</h3>
                        <p className="mt-1 text-xs text-text-light">Paste CSV rows: Brand,Model,ReleaseYear</p>
                        <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8} className="mt-3 w-full border border-border bg-background p-3 text-sm outline-none focus:border-ink" placeholder={`Brand,Model,ReleaseYear\nApple,iPhone 17,2026\nSamsung,S26 Ultra,2026`} />
                        {importResult && (
                            <div className="mt-3 border border-green-300 bg-green-50 p-3 text-sm text-green-800">
                                Created: {importResult.created}, Skipped: {importResult.skipped}
                                {importResult.errors && <pre className="mt-1 text-xs">{importResult.errors.join('\n')}</pre>}
                            </div>
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => { setCsvModal(false); setImportResult(null); }} className="btn-outline text-xs">Cancel</button>
                            <button onClick={handleCsvImport} className="btn-primary text-xs">Import</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function TemplatePreview({ form }) {
    var cw = parseFloat(form.caseWidth) || 80;
    var ch = parseFloat(form.caseHeight) || 160;
    var scale = Math.min(180 / ch, 140 / cw, 1);
    var pw = Math.round(cw * scale);
    var ph = Math.round(ch * scale);
    var cr = Math.round((parseFloat(form.cornerRadius) || 10) * scale);
    var safeTop = (parseFloat(form.safeAreaTop || 0) / ch) * ph;
    var safeBottom = (parseFloat(form.safeAreaBottom || 0) / ch) * ph;
    var safeLeft = (parseFloat(form.safeAreaLeft || 0) / cw) * pw;
    var safeRight = (parseFloat(form.safeAreaRight || 0) / cw) * pw;
    var hasCam = form.cameraX != null && form.cameraY != null && form.cameraWidth && form.cameraHeight;
    var camL = hasCam ? ((parseFloat(form.cameraX) / cw) * pw) + 'px' : '0';
    var camT = hasCam ? ((parseFloat(form.cameraY) / ch) * ph) + 'px' : '0';
    var camW = hasCam ? ((parseFloat(form.cameraWidth) / cw) * pw) + 'px' : '0';
    var camH = hasCam ? ((parseFloat(form.cameraHeight) / ch) * ph) + 'px' : '0';
    var camCr = hasCam ? Math.max(2, Math.round(Math.min(parseFloat(form.cameraWidth), parseFloat(form.cameraHeight)) * 0.2 * scale)) : 0;
    return (
        <div className={'flex flex-col items-center justify-center rounded-xl bg-stone-900/5 p-4'}>
            <div className={'relative'} style={{ width: pw, height: ph }}>
                <div style={{ width: pw, height: ph, borderRadius: cr, background: '#1a1a1e', position: 'relative', overflow: 'hidden' }}>
                    <div className={'absolute inset-0'} style={{ borderRadius: cr, background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)' }} />
                    <div style={{ position: 'absolute', top: safeTop, bottom: safeBottom, left: safeLeft, right: safeRight, border: '1.5px dashed rgba(34,197,94,0.5)', borderRadius: cr * 0.7 }}>
                        <span className={'absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] font-semibold uppercase tracking-wider text-green-600/50 whitespace-nowrap'}>Safe</span>
                    </div>
                    {hasCam && (
                        <>
                            <div style={{ position: 'absolute', left: `calc(${camL} - 2px)`, top: `calc(${camT} - 2px)`, width: `calc(${camW} + 4px)`, height: `calc(${camH} + 4px)`, background: 'linear-gradient(145deg, rgba(180,185,200,0.5) 0%, rgba(140,145,160,0.4) 50%, rgba(100,105,120,0.5) 100%)', borderRadius: camCr + 2, zIndex: 1 }} />
                            <div style={{ position: 'absolute', left: camL, top: camT, width: camW, height: camH, background: '#000', borderRadius: camCr, zIndex: 2, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.9)' }} />
                        </>
                    )}
                </div>
                <div className={'mt-2 text-center'}>
                    <p className={'text-[10px] font-medium text-stone-400'}>{cw}x{ch}mm</p>
                </div>
            </div>
        </div>
    );
}

function TemplateFormModal({ template, brands, models, templates, onBrandChange, onSave, onClose }) {
    const [form, setForm] = useState({ ...template });
    const [selectedBrandId, setSelectedBrandId] = useState('');

    useEffect(() => {
        if (template.model?.Brands?.id || template.model?.brandId) {
            const bid = template.model?.Brands?.id || template.model?.brandId;
            setSelectedBrandId(bid);
            onBrandChange(bid);
        }
    }, []);

    const handleBrandSelect = (brandId) => {
        setSelectedBrandId(brandId);
        onBrandChange(brandId);
    };

    const submit = (e) => {
        e.preventDefault();
        const { model, ...clean } = form;
        onSave(clean);
    };

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="flex w-full max-w-4xl gap-6 border border-border bg-surface p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg">{form.id ? 'Edit Template' : 'New Template'}</h3>
                    <form onSubmit={submit} className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Brand</label>
                            <select value={selectedBrandId} onChange={e => handleBrandSelect(e.target.value)} className="mt-1 w-full border border-border bg-background p-2.5 text-sm outline-none focus:border-ink">
                                <option value="">Select brand</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Model</label>
                            <select value={form.deviceModelId} onChange={e => set('deviceModelId', parseInt(e.target.value))} className="mt-1 w-full border border-border bg-background p-2.5 text-sm outline-none focus:border-ink">
                                <option value="">Select model</option>
                                {models.filter(m => {
                                    const existing = template.deviceModelId;
                                    return !existing || m.id === existing || !templates?.find(t => t.deviceModelId === m.id);
                                }).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <fieldset className="border border-border p-3">
                        <legend className="px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Case Dimensions</legend>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div><label className="text-[10px] text-text-light">Width (mm)</label><input type="number" step="0.1" value={form.caseWidth} onChange={e => set('caseWidth', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Height (mm)</label><input type="number" step="0.1" value={form.caseHeight} onChange={e => set('caseHeight', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Corner Radius (mm)</label><input type="number" step="0.1" value={form.cornerRadius} onChange={e => set('cornerRadius', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Bleed Area (mm)</label><input type="number" step="0.1" value={form.bleedArea} onChange={e => set('bleedArea', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" /></div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-border p-3">
                        <legend className="px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Safe Area</legend>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div><label className="text-[10px] text-text-light">Top (mm)</label><input type="number" step="0.1" value={form.safeAreaTop} onChange={e => set('safeAreaTop', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Bottom (mm)</label><input type="number" step="0.1" value={form.safeAreaBottom} onChange={e => set('safeAreaBottom', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Left (mm)</label><input type="number" step="0.1" value={form.safeAreaLeft} onChange={e => set('safeAreaLeft', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Right (mm)</label><input type="number" step="0.1" value={form.safeAreaRight} onChange={e => set('safeAreaRight', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-border p-3">
                        <legend className="px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Camera Cutout</legend>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div><label className="text-[10px] text-text-light">X (mm)</label><input type="number" step="0.1" value={form.cameraX} onChange={e => set('cameraX', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Y (mm)</label><input type="number" step="0.1" value={form.cameraY} onChange={e => set('cameraY', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Width (mm)</label><input type="number" step="0.1" value={form.cameraWidth} onChange={e => set('cameraWidth', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                            <div><label className="text-[10px] text-text-light">Height (mm)</label><input type="number" step="0.1" value={form.cameraHeight} onChange={e => set('cameraHeight', parseFloat(e.target.value))} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" required /></div>
                        </div>
                    </fieldset>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Base Price (₹)</label>
                            <input type="number" value={form.basePrice} onChange={e => set('basePrice', parseInt(e.target.value) || 399)} className="mt-1 w-full border border-border bg-background p-2.5 text-sm outline-none focus:border-ink" />
                        </div>
                        <div>
                            <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Active</label>
                            <div className="mt-2 flex items-center gap-2">
                                <input type="checkbox" checked={form.isActive !== false} onChange={e => set('isActive', e.target.checked)} className="h-4 w-4 accent-ink" />
                                <span className="text-xs text-text-light">{form.isActive !== false ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>

                    <fieldset className="border border-border p-3">
                        <legend className="px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-text-light">Assets (URLs)</legend>
                        <div className="space-y-2">
                            <div><label className="text-[10px] text-text-light">Preview Image URL</label><input type="text" value={form.previewImage || ''} onChange={e => set('previewImage', e.target.value)} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" /></div>
                            <div><label className="text-[10px] text-text-light">SVG Mask URL</label><input type="text" value={form.svgMask || ''} onChange={e => set('svgMask', e.target.value)} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" /></div>
                            <div><label className="text-[10px] text-text-light">Thumbnail URL</label><input type="text" value={form.thumbnail || ''} onChange={e => set('thumbnail', e.target.value)} className="mt-1 w-full border border-border bg-background p-2 text-sm outline-none focus:border-ink" /></div>
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn-outline text-xs">Cancel</button>
                        <button type="submit" className="btn-primary text-xs">{form.id ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
            <div className="w-52 shrink-0 hidden lg:block pt-9">
                <TemplatePreview form={form} />
            </div>
        </div>
        </div>
    );
}
