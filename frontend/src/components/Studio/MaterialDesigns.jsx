'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { useStudio } from '@/context/StudioContext';
import { fetchMaterialDesigns } from '@/services/studioApi';
import { useToast } from '@/components/ui/Toast';

export default function MaterialDesigns() {
    const { materialId, material, updateForm, clearAll } = useStudio();
    const toast = useToast();
    const scrollRef = useRef(null);
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(null);

    useEffect(() => {
        if (!materialId) return;
        let mounted = true;
        setLoading(true);
        fetchMaterialDesigns(materialId)
            .then((data) => { if (mounted) setDesigns(data); })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [materialId]);

    if (!materialId || !material) return null;

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 160, behavior: 'smooth' });
        }
    };

    const applyDesign = async (design) => {
        setApplying(design.id);
        clearAll();
        updateForm({ bgImage: design.imageUrl, bgColor: null });
        toast.success(`"${design.name}" applied`);
        setTimeout(() => setApplying(null), 600);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Designs
                    {designs.length > 0 && <span className="ml-1 font-normal text-stone-400">· {designs.length}</span>}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { clearAll(); updateForm({ bgImage: null, bgColor: '#F4F4F5' }); toast.success('Blank canvas'); }}
                        className="flex items-center gap-1 rounded-full border border-stone-200 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700"
                    >
                        <Plus className="h-2.5 w-2.5" /> Blank
                    </button>
                    {designs.length > 2 && (
                        <>
                            <button onClick={() => scroll(-1)} className="rounded-full border border-stone-200 p-1 text-stone-400 hover:border-stone-400 hover:text-stone-600">
                                <ChevronRight className="h-3 w-3 rotate-180" />
                            </button>
                            <button onClick={() => scroll(1)} className="rounded-full border border-stone-200 p-1 text-stone-400 hover:border-stone-400 hover:text-stone-600">
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex gap-2 overflow-hidden">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="min-w-[110px] overflow-hidden rounded-xl border border-stone-200">
                            <div className="aspect-square w-full animate-pulse bg-stone-100" />
                            <div className="space-y-1 p-1.5"><div className="h-2.5 w-3/4 animate-pulse rounded bg-stone-100" /><div className="h-2 w-1/2 animate-pulse rounded bg-stone-100" /></div>
                        </div>
                    ))}
                </div>
            ) : designs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-3 text-center">
                    <p className="text-[10px] text-stone-400">No designs for this material. Upload your own or use AI.</p>
                </div>
            ) : (
                <div className="relative">
                    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                        {designs.map((d) => (
                            <button
                                key={d.id}
                                onClick={() => applyDesign(d)}
                                disabled={applying === d.id}
                                className="group relative shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition-all duration-300 hover:border-stone-400 hover:shadow-md disabled:opacity-60"
                                style={{ width: '110px', scrollSnapAlign: 'start' }}
                            >
                                <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                                    <img
                                        src={d.imageUrl}
                                        alt={d.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    {d.designer && (
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/70 to-transparent p-1.5">
                                            <span className="text-[8px] font-medium text-white/80">{d.designer}</span>
                                        </div>
                                    )}
                                    {applying === d.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-1.5">
                                    <p className="truncate text-[10px] font-semibold text-stone-700">{d.name}</p>
                                </div>
                            </button>
                        ))}
                        <div className="min-w-[8px] shrink-0" />
                    </div>
                </div>
            )}
        </div>
    );
}
