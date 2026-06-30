'use client';
import { useRef } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { formatINR } from '@/utils/format';

export default function MaterialSelector() {
    const { materialId, setMaterialId, materials, materialsLoading, modelId } = useStudio();
    const selectedMaterial = materials.find((m) => m.id === materialId);
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Material
                    {selectedMaterial && <span className="ml-1 font-normal text-stone-400">· {materials.length}</span>}
                </h3>
                {materials.length > 3 && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => scroll(-1)} className="rounded-full border border-stone-200 p-1 text-stone-400 hover:border-stone-400 hover:text-stone-600">
                            <ChevronRight className="h-3 w-3 rotate-180" />
                        </button>
                        <button onClick={() => scroll(1)} className="rounded-full border border-stone-200 p-1 text-stone-400 hover:border-stone-400 hover:text-stone-600">
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>

            {!modelId ? (
                <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-4 text-center">
                    <p className="text-[11px] text-stone-400">Select a phone model first.</p>
                </div>
            ) : materialsLoading ? (
                <div className="flex gap-2 overflow-hidden">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="min-w-[120px] overflow-hidden rounded-xl border border-stone-200 bg-white">
                            <div className="h-20 animate-pulse bg-stone-100" />
                            <div className="space-y-1 p-2"><div className="h-3 w-3/4 animate-pulse rounded bg-stone-100" /><div className="h-2 w-1/2 animate-pulse rounded bg-stone-100" /></div>
                        </div>
                    ))}
                </div>
            ) : materials.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-4 text-center">
                    <p className="text-[11px] text-stone-400">No materials available.</p>
                </div>
            ) : (
                <div className="relative">
                    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                        {materials.map((m) => {
                            const isActive = materialId === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setMaterialId(m.id)}
                                    className={`group relative shrink-0 rounded-xl border text-left transition-all duration-300 ${isActive ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-2 bg-stone-50' : 'border-stone-200 bg-white hover:border-stone-400 hover:shadow-md'}`}
                                    style={{ width: '120px', scrollSnapAlign: 'start' }}
                                >
                                    <div className="p-3">
                                        <div className={`flex items-center justify-between ${isActive ? 'mb-2' : ''}`}>
                                            <p className={`truncate text-[10px] font-semibold leading-tight ${isActive ? 'text-stone-900' : 'text-stone-700'}`}>{m.label}</p>
                                            {isActive && <Check className="h-3 w-3 text-stone-900 shrink-0 ml-1" />}
                                        </div>
                                        <p className="text-[11px] font-mono tabular-nums text-stone-500">{formatINR(m.price)}</p>
                                    </div>
                                </button>
                            );
                        })}
                        <div className="min-w-[8px] shrink-0" />
                    </div>
                </div>
            )}

            {selectedMaterial?.description && (
                <div className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-stone-400">
                    <span>{selectedMaterial.description}</span>
                </div>
            )}
        </div>
    );
}
