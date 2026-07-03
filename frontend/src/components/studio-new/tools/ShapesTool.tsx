'use client';
import { useState } from 'react';
import { useStudioStore } from '@/store/studioStore';
import ColorPicker from '../shared/ColorPicker';
import Slider from '../shared/Slider';
import { SHAPES_DATA } from '@/lib/constants';
import type { ShapeType } from '@/types/studio';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function ShapesTool() {
  const addLayer = useStudioStore((s) => s.addLayer);
  const [fill, setFill] = useState('#0A0A0A');
  const [stroke, setStroke] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(0);

  const handleAdd = (shapeType: ShapeType) => {
    addLayer({
      type: 'shape',
      shapeType,
      fill,
      stroke,
      strokeWidth,
      opacity: 1,
      rotation: 0,
      x: 50, y: 100,
      width: 120, height: 120,
      visible: true, locked: false, name: shapeType,
      blendMode: 'normal',
      shadow: undefined,
      cornerRadius: 0,
    } as any);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {SHAPES_DATA.map((shape) => (
          <button
            key={shape.id}
            onClick={() => handleAdd(shape.id as ShapeType)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-accent/30 text-foreground transition-all hover:border-foreground hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            <span className="text-xl">{shape.icon}</span>
            <span className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground">{shape.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-accent/20 p-3 space-y-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Default Style</h4>
        <ColorPicker label="Fill Color" value={fill} onChange={setFill} />
        <ColorPicker label="Stroke Color" value={stroke} onChange={setStroke} />
        <Slider label="Stroke Width" value={strokeWidth} min={0} max={20} suffix="px" onChange={setStrokeWidth} />
      </div>
    </div>
  );
}
