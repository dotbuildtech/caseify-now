'use client';
import { useStudio } from '@/context/StudioContext';
import { STICKERS } from '@/utils/studio';
import { useToast } from '@/components/ui/Toast';

export default function StickersTab() {
    const { addStickerLayer } = useStudio();
    const toast = useToast();

    return (
        <div className="space-y-4 animate-fadeIn">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Stickers</p>
                <p className="mt-1 text-[11px] text-stone-400">Tap to add to your design</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {STICKERS.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => { addStickerLayer(s); toast.success(`${s.label} added`); }}
                        className="group flex aspect-square items-center justify-center rounded-xl border border-stone-200 bg-white text-3xl shadow-sm transition-all duration-200 hover:border-stone-400 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                    >
                        <span className="transition-transform duration-200 group-hover:scale-125">{s.emoji}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
