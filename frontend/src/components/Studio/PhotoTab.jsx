'use client';
import { useStudio } from '@/context/StudioContext';
import { PHOTO_PRESETS } from '@/utils/studio';
import { useToast } from '@/components/ui/Toast';
import SmartImage from '@/components/ui/SmartImage';

export default function PhotoTab() {
    const { addImageLayer } = useStudio();
    const toast = useToast();

    return (
        <div className="space-y-5">
            <div>
                <h3 className="label-luxe">Photo library</h3>
                <p className="mt-1 text-xs text-text-light">Curated backgrounds for your case.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {PHOTO_PRESETS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => { addImageLayer(p.url); toast.success(`${p.label} added`); }}
                        className="group relative aspect-square overflow-hidden border border-border bg-background-light"
                    >
                        <SmartImage src={p.url} alt={p.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-2 text-cream">
                            <p className="text-[10px] font-medium uppercase tracking-[0.18em]">{p.label}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
