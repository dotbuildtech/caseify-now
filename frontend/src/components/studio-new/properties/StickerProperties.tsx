'use client';
import { useStudioStore } from '@/store/studioStore';
import Slider from '../shared/Slider';
import ColorPicker from '../shared/ColorPicker';
import type { StickerLayer } from '@/types/studio';

export default function StickerProperties({ layer }: { layer: StickerLayer }) {
  const updateLayer = useStudioStore((s) => s.updateLayer);

  const update = (patch: Partial<StickerLayer>) => updateLayer(layer.id, patch);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <span className="text-3xl">{layer.emoji}</span>
        <div>
          <p className="text-sm font-medium capitalize">{layer.category}</p>
        </div>
      </div>

      <Section title="Size & Position">
        <Slider label="Size" value={layer.size} min={20} max={300} suffix="px" onChange={(v) => update({ size: v, width: v, height: v })} />
        <Slider label="Rotation" value={layer.rotation} min={-180} max={180} suffix="°" onChange={(v) => update({ rotation: v })} />
        <Slider label="Opacity" value={Math.round(layer.opacity * 100)} min={0} max={100} suffix="%" onChange={(v) => update({ opacity: v / 100 })} />
      </Section>

      <Section title="Color">
        <ColorPicker value={layer.color || '#000'} onChange={(c) => update({ color: c })} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pb-4 border-b border-border last:border-0">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
