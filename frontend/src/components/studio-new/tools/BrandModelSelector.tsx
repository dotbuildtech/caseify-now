'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStudioStore } from '@/store/studioStore';
import { fetchBrands, fetchModelsByBrand, fetchTemplateByModelId, fetchMaterials, searchModels } from '@/services/studioApi';
import { Search, ChevronDown, Smartphone, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BrandModelSelector() {
  const store = useStudioStore;
  const brand = useStudioStore((s) => s.brand);
  const brands = useStudioStore((s) => s.brands);
  const models = useStudioStore((s) => s.models);
  const modelId = useStudioStore((s) => s.modelId);
  const setBrand = useStudioStore((s) => s.setBrand);
  const setModelId = useStudioStore((s) => s.setModelId);
  const setBrands = useStudioStore((s) => s.setBrands);
  const setModels = useStudioStore((s) => s.setModels);
  const setModelsLoading = useStudioStore((s) => s.setModelsLoading);
  const setMaterials = useStudioStore((s) => s.setMaterials);
  const setMaterialsLoading = useStudioStore((s) => s.setMaterialsLoading);
  const setTemplate = useStudioStore((s) => s.setTemplate);
  const setTemplateLoading = useStudioStore((s) => s.setTemplateLoading);
  const setMaterialId = useStudioStore((s) => s.setMaterialId);

  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [brandQ, setBrandQ] = useState('');
  const [modelQ, setModelQ] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const globalRef = useRef<HTMLDivElement>(null);

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands().then((data) => {
      const brandsList = Array.isArray(data) ? data.map((b: any) => typeof b === 'string' ? { id: b.toLowerCase(), name: b, slug: b.toLowerCase() } : b) : [];
      setBrands(brandsList);
    }).catch(() => {});
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (!brand) return;
    setModelsLoading(true);
    fetchModelsByBrand(brand).then((data) => {
      const modelList = Array.isArray(data) ? data : [];
      setModels(modelList);
      if (modelList.length > 0 && !modelList.find((m: any) => m.id === modelId)) {
        setModelId(modelList[0].id);
      }
    }).catch(() => setModelsLoading(false));
  }, [brand]);

  // Fetch template and materials when model changes
  useEffect(() => {
    if (!modelId) return;
    setTemplateLoading(true);
    setMaterialsLoading(true);
    fetchTemplateByModelId(modelId).then((data) => setTemplate(data)).catch(() => setTemplateLoading(false));
    fetchMaterials(modelId).then((data) => {
      const matList = Array.isArray(data) ? data : [];
      setMaterials(matList);
      const defaultMat = matList.find((m: any) => m.isDefault) || matList[0];
      if (defaultMat) setMaterialId(defaultMat.id);
    }).catch(() => setMaterialsLoading(false));
  }, [modelId]);

  // Click outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setBrandOpen(false);
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
      if (globalRef.current && !globalRef.current.contains(e.target as Node)) setGlobalOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGlobalSearch = useCallback((q: string) => {
    setGlobalSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setGlobalResults([]); setGlobalOpen(false); return; }
    setLoading(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchModels(q);
      setGlobalResults(results);
      setGlobalOpen(results.length > 0);
      setLoading(false);
    }, 300);
  }, []);

  const handleSelectGlobal = (result: any) => {
    setBrand(result.brand);
    setModelId(result.id);
    setGlobalSearch(''); setGlobalOpen(false); setGlobalResults([]);
  };

  const brandList = Array.isArray(brands) ? brands : [];
  const modelList = Array.isArray(models) ? models : [];
  const filteredBrands = brandList.filter((b: any) => b.name.toLowerCase().includes(brandQ.toLowerCase()));
  const filteredModels = modelQ.trim() ? modelList.filter((m: any) => m.label?.toLowerCase().includes(modelQ.toLowerCase())) : modelList;
  const selectedModel = modelList.find((m: any) => m.id === modelId);

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Device</h3>

      {/* Global search */}
      <div ref={globalRef} className="relative">
        <div className="flex items-center rounded-lg border border-border bg-background px-3 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground transition-all">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input value={globalSearch} onChange={(e) => handleGlobalSearch(e.target.value)}
            placeholder="Search phone model..."
            className="w-full bg-transparent px-2 py-2 text-xs outline-none placeholder:text-muted-foreground/40" />
        </div>
        {globalOpen && globalResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg animate-in fade-in">
            {globalResults.map((r: any) => (
              <button key={r.id} onClick={() => handleSelectGlobal(r)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-accent">
                <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{r.label}</p>
                  <p className="text-[9px] text-muted-foreground">{r.brand} · {r.size}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Brand & Model dropdowns */}
      <div className="grid grid-cols-2 gap-2">
        <div ref={brandRef} className="relative">
          <button onClick={() => { setBrandOpen(v => !v); setModelOpen(false); setBrandQ(''); }}
            className="flex w-full items-center justify-between gap-1 h-9 rounded-lg border border-border bg-background px-3 text-xs transition-colors hover:border-foreground">
            <span className="truncate text-foreground">{brand || 'Brand'}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', brandOpen && 'rotate-180')} />
          </button>
          {brandOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[180px] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg animate-in fade-in">
              <div className="sticky top-0 border-b border-border bg-popover p-1.5">
                <input value={brandQ} onChange={(e) => setBrandQ(e.target.value)} placeholder="Filter..." autoFocus
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-[10px] outline-none focus:border-foreground" />
              </div>
              {filteredBrands.map((b: any) => (
                <button key={b.name} onClick={() => { setBrand(b.name); setBrandOpen(false); }}
                  className={cn('flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-accent', brand === b.name ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground')}>
                  {b.name}
                  {brand === b.name && <Check className="h-3 w-3 text-foreground" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={modelRef} className="relative">
          <button onClick={() => { setModelOpen(v => !v); setBrandOpen(false); setModelQ(''); }}
            disabled={modelList.length === 0}
            className="flex w-full items-center justify-between gap-1 h-9 rounded-lg border border-border bg-background px-3 text-xs transition-colors hover:border-foreground disabled:opacity-50">
            <span className="truncate text-foreground">{selectedModel?.name || 'Model'}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', modelOpen && 'rotate-180')} />
          </button>
          {modelOpen && filteredModels.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[180px] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg animate-in fade-in">
              <div className="sticky top-0 border-b border-border bg-popover p-1.5">
                <input value={modelQ} onChange={(e) => setModelQ(e.target.value)} placeholder="Filter..." autoFocus
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-[10px] outline-none focus:border-foreground" />
              </div>
              {filteredModels.map((m: any) => (
                <button key={m.id} onClick={() => { setModelId(m.id); setModelOpen(false); }}
                  className={cn('flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-accent', modelId === m.id ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground')}>
                  <div className="min-w-0">
                    <span className="truncate">{m.label}</span>
                    <span className="ml-1.5 text-[9px] text-muted-foreground">{m.size}</span>
                  </div>
                  {modelId === m.id && <Check className="h-3 w-3 shrink-0 text-foreground" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedModel && (
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{selectedModel.size} · {brand}</p>
      )}
    </div>
  );
}
