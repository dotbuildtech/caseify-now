'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminCreateStudioTemplateV2, adminUpdateStudioTemplateV2, adminListBrands } from '@/services/adminApi';
import { adminGetBrandModels } from '@/services/adminApi';

const METADATA_TEMPLATE = JSON.stringify({
  canvasWidth: 1080,
  canvasHeight: 1920,
  printWidth: 80,
  printHeight: 160,
  bleed: 3,
  safeMargin: 5,
  defaultZoom: 1,
  editableArea: { type: 'rect', x: 50, y: 100, width: 900, height: 1500 },
  camera: { x: 400, y: 60, width: 280, height: 350 }
}, null, 2);

function FileInput({ label, accept, state, setter, currentUrl }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!state) { setPreview(null); return; }
    const url = URL.createObjectURL(state);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [state]);

  return (
    <div>
      <label className="label-luxe">{label}</label>
      <input type="file" accept={accept} onChange={(e) => setter(e.target.files[0])} className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:border file:border-border file:bg-surface file:text-xs file:font-medium hover:file:bg-background-light" />
      {state ? (
        <div className="mt-1 flex items-center gap-2">
          {preview && <img src={preview} alt="" className="h-12 w-12 object-cover rounded border" />}
          <span className="text-[10px] text-text-light truncate">{state.name}</span>
        </div>
      ) : currentUrl ? (
        <img src={currentUrl} alt="" className="mt-1 h-12 w-12 object-cover rounded border" />
      ) : null}
    </div>
  );
}

function SvgInput({ label, accept, state, setter, currentUrl }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!state) { setPreview(null); return; }
    const url = URL.createObjectURL(state);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [state]);

  return (
    <div>
      <label className="label-luxe">{label}</label>
      <input type="file" accept={accept} onChange={(e) => setter(e.target.files[0])} className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:border file:border-border file:bg-surface file:text-xs file:font-medium hover:file:bg-background-light" />
      {state ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] text-text-light truncate">{state.name}</span>
          {preview && <a href={preview} target="_blank" rel="noopener noreferrer" className="text-[10px] underline text-text-light">Preview</a>}
        </div>
      ) : currentUrl ? (
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[10px] underline text-text-light">View current</a>
      ) : null}
    </div>
  );
}

export default function StudioTemplateForm({ mode, initial }) {
  const router = useRouter();
  const toast = useToast();

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [brandId, setBrandId] = useState(initial?.brandId || '');
  const [modelId, setModelId] = useState(initial?.modelId || '');
  const [name, setName] = useState(initial?.name || '');
  const [version, setVersion] = useState(initial?.version || '1.0');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState(initial?.status || 'active');
  const [metadataJson, setMetadataJson] = useState(initial?.metadataJson ? JSON.stringify(initial.metadataJson, null, 2) : METADATA_TEMPLATE);

  const [previewImageFile, setPreviewImageFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [maskSvgFile, setMaskSvgFile] = useState(null);
  const [cameraSvgFile, setCameraSvgFile] = useState(null);
  const [safeAreaSvgFile, setSafeAreaSvgFile] = useState(null);
  const [bleedSvgFile, setBleedSvgFile] = useState(null);
  const [outlineSvgFile, setOutlineSvgFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminListBrands({}).then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    if (!brandId) { setModels([]); setModelId(''); return; }
    adminGetBrandModels(brandId).then(setModels).catch(() => setModels([]));
  }, [brandId]);

  const appendFile = (fd, key, file) => {
    if (file) fd.append(key, file, file.name);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !brandId || !modelId) { setError('Name, Brand, and Model are required'); return; }
    setSaving(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('brandId', brandId);
      fd.append('modelId', modelId);
      fd.append('name', name.trim());
      fd.append('version', version.trim() || '1.0');
      if (description) fd.append('description', description.trim());
      fd.append('status', status);
      try { fd.append('metadataJson', JSON.stringify(JSON.parse(metadataJson))); }
      catch { setError('Invalid JSON in metadata'); setSaving(false); return; }

      appendFile(fd, 'previewImage', previewImageFile);
      appendFile(fd, 'thumbnail', thumbnailFile);
      appendFile(fd, 'maskSvg', maskSvgFile);
      appendFile(fd, 'cameraSvg', cameraSvgFile);
      appendFile(fd, 'safeAreaSvg', safeAreaSvgFile);
      appendFile(fd, 'bleedSvg', bleedSvgFile);
      appendFile(fd, 'outlineSvg', outlineSvgFile);

      if (mode === 'edit') {
        await adminUpdateStudioTemplateV2(initial.id, fd);
        toast.success('Template updated');
      } else {
        await adminCreateStudioTemplateV2(fd);
        toast.success('Template created');
      }
      router.push('/admin/studio-templates');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <div className="border border-border bg-surface p-5 md:p-6">
        <h3 className="mb-4 font-display text-lg">{mode === 'edit' ? 'Edit' : 'New'} Studio Template</h3>
        {error && <p className="mb-3 text-sm text-error">{error}</p>}
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-luxe">Brand *</label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="input-luxe" disabled={mode === 'edit'}>
                <option value="">Select brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-luxe">Model *</label>
              <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="input-luxe" disabled={mode === 'edit'}>
                <option value="">Select model</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-luxe">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-luxe" placeholder="e.g. iPhone 15 Pro Template" />
            </div>
            <div>
              <label className="label-luxe">Version</label>
              <input value={version} onChange={(e) => setVersion(e.target.value)} className="input-luxe" placeholder="1.0" />
            </div>
          </div>
          <div>
            <label className="label-luxe">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-luxe resize-y" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ink">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            Status
          </label>
        </div>
      </div>

      <div className="border border-border bg-surface p-5 md:p-6">
        <h3 className="mb-4 font-display text-lg">Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mode === 'edit' && initial ? (
            <>
              <FileInput label="Preview Image *" accept=".png,.jpg,.jpeg,.webp" state={previewImageFile} setter={setPreviewImageFile} currentUrl={initial.previewImage} />
              <FileInput label="Thumbnail" accept=".png,.jpg,.jpeg,.webp" state={thumbnailFile} setter={setThumbnailFile} currentUrl={initial.thumbnail} />
              <SvgInput label="Mask SVG *"  state={maskSvgFile} setter={setMaskSvgFile} currentUrl={initial.maskSvg} />
              <SvgInput label="Camera Cutout SVG *"  state={cameraSvgFile} setter={setCameraSvgFile} currentUrl={initial.cameraSvg} />
              <SvgInput label="Safe Area SVG"  state={safeAreaSvgFile} setter={setSafeAreaSvgFile} currentUrl={initial.safeAreaSvg} />
              <SvgInput label="Bleed SVG"  state={bleedSvgFile} setter={setBleedSvgFile} currentUrl={initial.bleedSvg} />
              <SvgInput label="Outline SVG"  state={outlineSvgFile} setter={setOutlineSvgFile} currentUrl={initial.outlineSvg} />
            </>
          ) : (
            <>
              <FileInput label="Preview Image *" accept=".png,.jpg,.jpeg,.webp" state={previewImageFile} setter={setPreviewImageFile} />
              <FileInput label="Thumbnail" accept=".png,.jpg,.jpeg,.webp" state={thumbnailFile} setter={setThumbnailFile} />
              <SvgInput label="Mask SVG *"  state={maskSvgFile} setter={setMaskSvgFile} />
              <SvgInput label="Camera Cutout SVG *"  state={cameraSvgFile} setter={setCameraSvgFile} />
              <SvgInput label="Safe Area SVG"  state={safeAreaSvgFile} setter={setSafeAreaSvgFile} />
              <SvgInput label="Bleed SVG"  state={bleedSvgFile} setter={setBleedSvgFile} />
              <SvgInput label="Outline SVG"  state={outlineSvgFile} setter={setOutlineSvgFile} />
            </>
          )}
        </div>
      </div>

      <div className="border border-border bg-surface p-5 md:p-6">
        <h3 className="mb-4 font-display text-lg">Metadata (JSON)</h3>
        <p className="mb-2 text-[10px] text-text-light">Canvas dimensions, print specs, camera position, editable area.</p>
        <textarea value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} rows={14} className="input-luxe resize-y font-mono text-xs" />
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push('/admin/studio-templates')} className="btn-secondary">
          <X className="h-4 w-4" /> Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Saving\u2026' : mode === 'edit' ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
