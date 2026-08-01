'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminListStudioTemplatesV2, adminDeleteStudioTemplateV2, adminDuplicateStudioTemplateV2, adminToggleStudioTemplateV2Status } from '@/services/adminApi';
import { adminListBrands } from '@/services/adminApi';
import { formatDate } from '@/utils/format';

export default function AdminStudioTemplatesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterBrand) params.brandId = filterBrand;
      const data = await adminListStudioTemplatesV2(params);
      setItems(data);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  }, [search, filterBrand]);

  useEffect(() => {
    adminListBrands({}).then(setBrands).catch(() => {});
  }, []);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const del = async (tpl) => {
    if (!confirm(`Delete "${tpl.name}"?`)) return;
    try {
      await adminDeleteStudioTemplateV2(tpl.id);
      toast.success('Template deleted');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const duplicate = async (tpl) => {
    try {
      await adminDuplicateStudioTemplateV2(tpl.id);
      toast.success('Duplicated');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Duplicate failed'); }
  };

  const toggleStatus = async (tpl) => {
    try {
      await adminToggleStudioTemplateV2Status(tpl.id);
      toast.success(`Template ${tpl.status === 'active' ? 'deactivated' : 'activated'}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Toggle failed'); }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Studio Templates</h2>
          <p className="mt-1 text-xs text-text-light">{loading ? 'Loading\u2026' : `${items.length} templates`}</p>
        </div>
        <Link href="/admin/studio-templates/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New template
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center border border-border bg-surface px-3 focus-within:border-ink">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates\u2026" className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-text-light" />
        </div>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-ink">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="border border-border bg-surface">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-background-light animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-light">No templates found.</div>
        ) : (
          <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {items.map((tpl) => (
              <li key={tpl.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex items-center gap-3">
                  <img src={tpl.previewImage} alt={tpl.name} className="h-12 w-12 object-cover rounded" />
                  <div>
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="text-[10px] text-text-light">
                      {tpl.brand?.name || '—'} / {tpl.model?.name || '—'} &middot; v{tpl.version} &middot;
                      <span className={tpl.status === 'active' ? 'text-green-600' : 'text-text-light'}> {tpl.status}</span>
                      &middot; {formatDate(tpl.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleStatus(tpl)} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink" title="Toggle status">
                    {tpl.status === 'active' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => duplicate(tpl)} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink" title="Duplicate">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <Link href={`/admin/studio-templates/${tpl.id}`} className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-ink">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={() => del(tpl)} className="inline-flex h-8 w-8 items-center justify-center border border-border text-error hover:border-error">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
