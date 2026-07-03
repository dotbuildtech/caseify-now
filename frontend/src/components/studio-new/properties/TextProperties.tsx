'use client';
import { useState, useEffect } from 'react';
import { useStudioStore } from '@/store/studioStore';
import Slider from '../shared/Slider';
import ColorPicker from '../shared/ColorPicker';
import { FONTS, loadGoogleFonts } from '@/lib/fonts';
import { FONT_CATEGORIES } from '@/lib/constants';
import { FontCategory } from '@/types/studio';
import type { TextLayer, Shadow } from '@/types/studio';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TextProperties({ layer }: { layer: TextLayer }) {
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState<FontCategory | 'all'>('all');

  const fonts = fontCategory === 'all'
    ? FONTS.filter(f => f.family.toLowerCase().includes(fontSearch.toLowerCase()))
    : FONTS.filter(f => f.category === fontCategory && f.family.toLowerCase().includes(fontSearch.toLowerCase()));

  const update = (patch: Partial<TextLayer>) => updateLayer(layer.id, patch);

  useEffect(() => {
    const font = FONTS.find(f => f.id === layer.fontFamily);
    if (font) loadGoogleFonts([font.family]);
  }, [layer.fontFamily]);

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <Section title="Text">
        <textarea
          value={layer.text}
          onChange={(e) => update({ text: e.target.value })}
          className="w-full h-20 rounded-lg border border-border bg-background p-2.5 text-xs outline-none focus:border-foreground resize-none"
        />
      </Section>

      {/* Font Selection */}
      <Section title="Font">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={fontSearch}
            onChange={(e) => setFontSearch(e.target.value)}
            placeholder="Search fonts..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs outline-none focus:border-foreground"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          <button onClick={() => setFontCategory('all')} className={cn('shrink-0 px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all', fontCategory === 'all' ? 'bg-foreground text-background' : 'bg-accent text-muted-foreground hover:text-foreground')}>All</button>
          {FONT_CATEGORIES.filter(c => c.id !== 'popular').map((cat) => (
            <button key={cat.id} onClick={() => setFontCategory(cat.id as FontCategory)} className={cn('shrink-0 px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all', fontCategory === cat.id ? 'bg-foreground text-background' : 'bg-accent text-muted-foreground hover:text-foreground')}>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="max-h-[160px] overflow-y-auto space-y-0.5 rounded-lg border border-border p-1">
          {fonts.map((font) => {
            const selected = layer.fontFamily === font.id;
            return (
              <button
                key={font.id}
                onClick={() => { update({ fontFamily: font.id }); loadGoogleFonts([font.family]); }}
                className={cn('w-full text-left px-3 py-2 rounded-md text-sm transition-all', selected ? 'bg-foreground text-background' : 'hover:bg-accent')}
                style={{ fontFamily: font.family }}
              >
                {font.family}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Size & Weight */}
      <Section title="Styling">
        <Slider label="Size" value={layer.fontSize} min={8} max={200} suffix="px" onChange={(v) => update({ fontSize: v })} />
        <Slider label="Weight" value={layer.fontWeight} min={100} max={900} step={100} suffix="" onChange={(v) => update({ fontWeight: v })} />
        <Slider label="Letter Spacing" value={layer.letterSpacing} min={-5} max={20} step={0.5} suffix="px" onChange={(v) => update({ letterSpacing: v })} />
        <Slider label="Line Height" value={layer.lineHeight * 100} min={50} max={300} suffix="%" onChange={(v) => update({ lineHeight: v / 100 })} />
      </Section>

      {/* Color */}
      <Section title="Color">
        <ColorPicker value={layer.color} onChange={(c) => update({ color: c })} />
      </Section>

      {/* Gradient */}
      <Section title="Gradient Text">
        <ToggleButton active={layer.gradient?.enabled ?? false} onClick={() => update({ gradient: { ...layer.gradient || { startColor: '#FF0000', endColor: '#0000FF', angle: 90 }, enabled: !layer.gradient?.enabled } })} label="Gradient" />
        {layer.gradient?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <ColorPicker value={layer.gradient.startColor} onChange={(c) => update({ gradient: { ...layer.gradient as any, startColor: c } })} />
            <ColorPicker value={layer.gradient.endColor} onChange={(c) => update({ gradient: { ...layer.gradient as any, endColor: c } })} />
            <Slider label="Angle" value={layer.gradient.angle} min={0} max={360} suffix="°" onChange={(v) => update({ gradient: { ...layer.gradient as any, angle: v } })} />
          </div>
        )}
      </Section>

      {/* Stroke */}
      <Section title="Stroke">
        <ToggleButton active={layer.stroke?.enabled ?? false} onClick={() => update({ stroke: { ...layer.stroke || { color: '#000', width: 2 }, enabled: !layer.stroke?.enabled } })} label="Outline" />
        {layer.stroke?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <ColorPicker value={layer.stroke.color} onChange={(c) => update({ stroke: { ...layer.stroke as any, color: c } })} />
            <Slider label="Width" value={layer.stroke.width} min={0} max={20} suffix="px" onChange={(v) => update({ stroke: { ...layer.stroke as any, width: v } })} />
          </div>
        )}
      </Section>

      {/* Shadow */}
      <Section title="Shadow">
        <ToggleButton active={layer.shadow?.enabled ?? false} onClick={() => update({ shadow: { ...layer.shadow || { color: '#000', blur: 10, offsetX: 2, offsetY: 2 }, enabled: !layer.shadow?.enabled } })} label="Shadow" />
        {layer.shadow?.enabled && (
          <>
            <ColorPicker value={layer.shadow.color} onChange={(c) => update({ shadow: { ...layer.shadow as Shadow, color: c } })} />
            <Slider label="Blur" value={layer.shadow.blur} min={0} max={50} suffix="px" onChange={(v) => update({ shadow: { ...layer.shadow as Shadow, blur: v } })} />
          </>
        )}
      </Section>

      {/* Alignment */}
      <Section title="Alignment">
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => update({ alignment: align })}
              className={cn('flex-1 h-8 rounded-lg border text-[10px] font-medium uppercase transition-all', layer.alignment === align ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground')}
            >
              {align}
            </button>
          ))}
        </div>
      </Section>

      {/* Text Transform */}
      <Section title="Transform">
        <div className="flex gap-2">
          <ToggleButton active={layer.uppercase} onClick={() => update({ uppercase: !layer.uppercase })} label="Uppercase" />
        </div>
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
