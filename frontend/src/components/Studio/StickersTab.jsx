'use client';
import { useStudio } from '@/context/StudioContext';
import { STICKERS } from '@/utils/studio';
import { useToast } from '@/components/ui/Toast';

export default function StickersTab() {
    const { addStickerLayer } = useStudio();
    const toast = useToast();

    return (
        <div className="space-y-5">
            <div>
                <h3 className="label-luxe">Stickers</h3>
                <p className="mt-1 text-xs text-text-light">Tap to add to your design.</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {STICKERS.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => { addStickerLayer(s); toast.success(`${s.label} added`); }}
                        className="group flex aspect-square items-center justify-center border border-border bg-background-light text-3xl transition-all hover:border-ink hover:bg-ink hover:text-cream"
                    >
                        {s.emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
