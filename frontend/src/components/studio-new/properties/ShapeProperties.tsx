'use client';
import { useStudioStore } from '@/store/studioStore';
import Slider from '../shared/Slider';
import ColorPicker from '../shared/ColorPicker';
import type { ShapeLayer, Shadow } from '@/types/studio';

export default function ShapeProperties({ layer }: { layer: ShapeLayer }) {
  const updateLayer = useStudioStore((s) => s.updateLayer);

  const update = (patch: Partial<ShapeLayer>) => updateLayer(layer.id, patch);

  return (
    <div className="space-y-4">
      <Section title="Fill">
        <ColorPicker value={layer.fill} onChange={(c) => update({ fill: c })} />
      </Section>

      <Section title="Stroke">
        <div className="flex gap-2">
          <ColorPicker value={layer.stroke} onChange={(c) => update({ stroke: c })} />
          <Slider label="Width" value={layer.strokeWidth} min={0} max={20} suffix="px" onChange={(v) => update({ strokeWidth: v })} />
        </div>
      </Section>

      <Section title="Size & Position">
        <Slider label="Width" value={layer.width} min={10} max={500} suffix="px" onChange={(v) => update({ width: v })} />
        <Slider label="Height" value={layer.height} min={10} max={500} suffix="px" onChange={(v) => update({ height: v })} />
        <Slider label="Rotation" value={layer.rotation} min={-180} max={180} suffix="°" onChange={(v) => update({ rotation: v })} />
        <Slider label="Opacity" value={Math.round(layer.opacity * 100)} min={0} max={100} suffix="%" onChange={(v) => update({ opacity: v / 100 })} />
        {layer.shapeType === 'rectangle' && (
          <Slider label="Corner Radius" value={layer.cornerRadius} min={0} max={100} suffix="px" onChange={(v) => update({ cornerRadius: v })} />
        )}
      </Section>

      <Section title="Shadow">
        <ToggleButton active={layer.shadow?.enabled ?? false} onClick={() => update({ shadow: { ...layer.shadow || { color: '#000', blur: 10, offsetX: 2, offsetY: 2 }, enabled: !layer.shadow?.enabled } })} label="Shadow" />
        {layer.shadow?.enabled && (
          <>
            <ColorPicker value={layer.shadow.color} onChange={(c) => update({ shadow: { ...layer.shadow as Shadow, color: c } })} />
            <Slider label="Blur" value={layer.shadow.blur} min={0} max={50} suffix="px" onChange={(v) => update({ shadow: { ...layer.shadow as Shadow, blur: v } })} />
          </>
        )}
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
