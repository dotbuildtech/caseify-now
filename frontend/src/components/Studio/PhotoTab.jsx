'use client';
import { useStudio } from '@/context/StudioContext';
import { PHOTO_PRESETS } from '@/utils/studio';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';

export default function PhotoTab() {
    const { addImageLayer } = useStudio();
    const toast = useToast();

    return (
        <div className="space-y-4 animate-fadeIn">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Photo library</p>
                <p className="mt-1 text-[11px] text-stone-400">Curated backgrounds for your case</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {PHOTO_PRESETS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => { addImageLayer(p.url); toast.success(`${p.label} added`); }}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                    >
                        <SmartImage src={p.url} alt={p.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent p-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white">{p.label}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
