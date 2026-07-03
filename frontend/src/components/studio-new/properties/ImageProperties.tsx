'use client';
import { useStudioStore } from '@/store/studioStore';
import Slider from '../shared/Slider';
import ColorPicker from '../shared/ColorPicker';
import type { ImageLayer } from '@/types/studio';

export default function ImageProperties({ layer }: { layer: ImageLayer }) {
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const update = (patch: Partial<ImageLayer>) => {
    updateLayer(layer.id, patch);
  };

  return (
    <div className="space-y-4">
      <Section title="Transform">
        <Slider label="Width" value={layer.width} min={20} max={500} suffix="px" onChange={(v) => update({ width: v })} />
        <Slider label="Height" value={layer.height} min={20} max={500} suffix="px" onChange={(v) => update({ height: v })} />
        <Slider label="Rotation" value={layer.rotation} min={-180} max={180} suffix="°" onChange={(v) => update({ rotation: v })} />
        <Slider label="Opacity" value={Math.round(layer.opacity * 100)} min={0} max={100} suffix="%" onChange={(v) => update({ opacity: v / 100 })} />
      </Section>

      <Section title="Flip">
        <div className="flex gap-2">
          <ToggleButton active={layer.flipX} onClick={() => update({ flipX: !layer.flipX })} label="Flip Horizontal" />
          <ToggleButton active={layer.flipY} onClick={() => update({ flipY: !layer.flipY })} label="Flip Vertical" />
        </div>
      </Section>

      <Section title="Filters">
        <Slider label="Brightness" value={layer.filters?.brightness ?? 100} min={0} max={200} suffix="%" onChange={(v) => update({ filters: { ...layer.filters, brightness: v } })} />
        <Slider label="Contrast" value={layer.filters?.contrast ?? 100} min={0} max={200} suffix="%" onChange={(v) => update({ filters: { ...layer.filters, contrast: v } })} />
        <Slider label="Saturation" value={layer.filters?.saturation ?? 100} min={0} max={200} suffix="%" onChange={(v) => update({ filters: { ...layer.filters, saturation: v } })} />
        <Slider label="Blur" value={layer.filters?.blur ?? 0} min={0} max={20} suffix="px" onChange={(v) => update({ filters: { ...layer.filters, blur: v } })} />
        <Slider label="Hue" value={layer.filters?.hue ?? 0} min={0} max={360} suffix="°" onChange={(v) => update({ filters: { ...layer.filters, hue: v } })} />
        <Slider label="Sepia" value={layer.filters?.sepia ?? 0} min={0} max={100} suffix="%" onChange={(v) => update({ filters: { ...layer.filters, sepia: v } })} />
        <Slider label="Grayscale" value={layer.filters?.grayscale ?? 0} min={0} max={100} suffix="%" onChange={(v) => update({ filters: { ...layer.filters, grayscale: v } })} />
      </Section>

      <Section title="Border">
        <ToggleButton active={layer.border?.enabled ?? false} onClick={() => update({ border: { ...layer.border || { color: '#000', width: 2, radius: 0 }, enabled: !layer.border?.enabled } })} label="Border" />
        {layer.border?.enabled && (
          <>
            <ColorPicker value={layer.border?.color || '#000'} onChange={(c) => update({ border: { ...layer.border!, color: c } })} />
            <Slider label="Width" value={layer.border?.width ?? 2} min={0} max={20} suffix="px" onChange={(v) => update({ border: { ...layer.border!, width: v } })} />
            <Slider label="Radius" value={layer.border?.radius ?? 0} min={0} max={50} suffix="px" onChange={(v) => update({ border: { ...layer.border!, radius: v } })} />
          </>
        )}
      </Section>

      <Section title="Shadow">
        <ToggleButton active={layer.shadow?.enabled ?? false} onClick={() => update({ shadow: { ...layer.shadow || { color: '#000', blur: 10, offsetX: 2, offsetY: 2 }, enabled: !layer.shadow?.enabled } })} label="Shadow" />
        {layer.shadow?.enabled && (
          <>
            <ColorPicker value={layer.shadow?.color || '#000'} onChange={(c) => update({ shadow: { ...layer.shadow!, color: c } })} />
            <Slider label="Blur" value={layer.shadow?.blur ?? 10} min={0} max={50} suffix="px" onChange={(v) => update({ shadow: { ...layer.shadow!, blur: v } })} />
            <Slider label="Offset X" value={layer.shadow?.offsetX ?? 2} min={-20} max={20} suffix="px" onChange={(v) => update({ shadow: { ...layer.shadow!, offsetX: v } })} />
            <Slider label="Offset Y" value={layer.shadow?.offsetY ?? 2} min={-20} max={20} suffix="px" onChange={(v) => update({ shadow: { ...layer.shadow!, offsetY: v } })} />
          </>
        )}
      </Section>

      <Section title="Corner Radius">
        <Slider label="Radius" value={layer.cornerRadius} min={0} max={100} suffix="px" onChange={(v) => update({ cornerRadius: v })} />
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

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-8 rounded-lg border text-[10px] font-medium transition-all ${
        active ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground'
      }`}
    >
      {label}
    </button>
  );
}
