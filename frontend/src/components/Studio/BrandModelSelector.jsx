'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Smartphone, Check } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { searchModels } from '@/services/studioApi';

export default function BrandModelSelector() {
    const { brand, setBrand, modelId, setModelId, brands, models, brandsLoading, modelsLoading } = useStudio();
    const [brandOpen, setBrandOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);
    const [brandQ, setBrandQ] = useState('');
    const [modelQ, setModelQ] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [globalResults, setGlobalResults] = useState([]);
    const [globalOpen, setGlobalOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const brandRef = useRef(null);
    const modelRef = useRef(null);
    const globalRef = useRef(null);
    const searchTimer = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (brandRef.current && !brandRef.current.contains(e.target)) setBrandOpen(false);
            if (modelRef.current && !modelRef.current.contains(e.target)) setModelOpen(false);
            if (globalRef.current && !globalRef.current.contains(e.target)) setGlobalOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleGlobalSearch = useCallback((q) => {
        setGlobalSearch(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (q.length < 2) { setGlobalResults([]); setGlobalOpen(false); return; }
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            const results = await searchModels(q);
            setGlobalResults(results);
            setGlobalOpen(results.length > 0);
            setSearching(false);
        }, 300);
    }, []);

    const handleSelectGlobal = (result) => {
        setBrand(result.brand);
        setModelId(result.id);
        setGlobalSearch('');
        setGlobalOpen(false);
        setGlobalResults([]);
    };

    const filteredBrands = brands.filter((b) => b.toLowerCase().includes(brandQ.toLowerCase()));

    const filteredModels = modelQ.trim()
        ? models.filter((m) => m.label.toLowerCase().includes(modelQ.toLowerCase()))
        : models;

    const selectedModel = models.find((m) => m.id === modelId);

    return (
        <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Device</h3>

            <div ref={globalRef} className="relative">
                <div className="flex items-center rounded-xl border border-stone-200 bg-white px-3 focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400">
                    <Search className="h-4 w-4 shrink-0 text-stone-400" />
                    <input
                        value={globalSearch}
                        onChange={(e) => handleGlobalSearch(e.target.value)}
                        placeholder="Search your phone model..."
                        className="w-full bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-stone-300"
                    />
                    {searching && <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />}
                </div>
                {globalOpen && globalResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[220px] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg">
                        {globalResults.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => handleSelectGlobal(r)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50"
                            >
                                <Smartphone className="h-4 w-4 shrink-0 text-stone-400" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-stone-700">{r.label}</p>
                                    <p className="text-[10px] text-stone-400">{r.brand} · {r.size}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div ref={brandRef} className="relative">
                    <button
                        onClick={() => { setBrandOpen((v) => !v); setModelOpen(false); setBrandQ(''); }}
                        className="flex w-full items-center justify-between gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm transition-colors hover:border-stone-400"
                    >
                        <span className="truncate text-stone-700">{brandsLoading ? 'Loading...' : brand || 'Select brand'}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${brandOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {brandOpen && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg">
                            <div className="sticky top-0 border-b border-stone-100 bg-white p-2">
                                <input
                                    value={brandQ}
                                    onChange={(e) => setBrandQ(e.target.value)}
                                    placeholder="Filter brands..."
                                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs outline-none focus:border-stone-400"
                                    autoFocus
                                />
                            </div>
                            {filteredBrands.map((b) => (
                                <button
                                    key={b}
                                    onClick={() => { setBrand(b); setBrandOpen(false); }}
                                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-stone-50 ${brand === b ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-600'}`}
                                >
                                    {b}
                                    {brand === b && <Check className="h-3.5 w-3.5 text-stone-900" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div ref={modelRef} className="relative">
                    <button
                        onClick={() => { setModelOpen((v) => !v); setBrandOpen(false); setModelQ(''); }}
                        disabled={modelsLoading || models.length === 0}
                        className="flex w-full items-center justify-between gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm transition-colors hover:border-stone-400 disabled:opacity-50"
                    >
                        <span className="truncate text-stone-700">
                            {modelsLoading ? 'Loading...' : selectedModel ? selectedModel.label : 'Select model'}
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {modelOpen && filteredModels.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg">
                            <div className="sticky top-0 border-b border-stone-100 bg-white p-2">
                                <input
                                    value={modelQ}
                                    onChange={(e) => setModelQ(e.target.value)}
                                    placeholder="Filter models..."
                                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs outline-none focus:border-stone-400"
                                    autoFocus
                                />
                            </div>
                            {filteredModels.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => { setModelId(m.id); setModelOpen(false); }}
                                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-stone-50 ${modelId === m.id ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-600'}`}
                                >
                                    <div className="min-w-0">
                                        <span className="truncate">{m.label}</span>
                                        <span className="ml-2 text-[10px] text-stone-400">{m.size}</span>
                                    </div>
                                    {modelId === m.id && <Check className="h-3.5 w-3.5 shrink-0 text-stone-900" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedModel && (
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{selectedModel.size} · {brand}</p>
            )}
        </div>
    );
}
