'use client';
import { useState, useRef } from 'react';
import { useStudioStore } from '@/store/studioStore';
import ColorPicker from '../shared/ColorPicker';
import Slider from '../shared/Slider';
import { COLOR_PALETTE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Image, Palette, Droplets, Upload, X } from 'lucide-react';
import { compressImage } from '@/lib/utils';
import { uploadStudioImageBlob } from '@/services/studioApi';

export default function BackgroundTool() {
  const background = useStudioStore((s) => s.background);
  const setBackgroundColor = useStudioStore((s) => s.setBackgroundColor);
  const setBackgroundImage = useStudioStore((s) => s.setBackgroundImage);
  const setBackgroundGradient = useStudioStore((s) => s.setBackgroundGradient);
  const [tab, setTab] = useState<'solid' | 'gradient' | 'image'>('solid');
  const [gradStart, setGradStart] = useState('#DC2626');
  const [gradEnd, setGradEnd] = useState('#0A0A0A');
  const [gradAngle, setGradAngle] = useState(135);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const blob = await compressImage(file, 1600, 0.85);
      const url = URL.createObjectURL(blob);
      setBackgroundImage(url);
      let cloudUrl: string | null = null;
      try { cloudUrl = await uploadStudioImageBlob(blob, 'image/jpeg'); } catch {}
      if (cloudUrl) setBackgroundImage(cloudUrl);
    } catch {} finally { setUploading(false); }
  };

  const presetGradients = [
    { start: '#DC2626', end: '#0A0A0A', angle: 135 },
    { start: '#F59E0B', end: '#DC2626', angle: 135 },
    { start: '#10B981', end: '#06B6D4', angle: 135 },
    { start: '#6366F1', end: '#EC4899', angle: 135 },
    { start: '#1E293B', end: '#0A0A0A', angle: 135 },
    { start: '#F472B6', end: '#FDE68A', angle: 90 },
    { start: '#3B82F6', end: '#8B5CF6', angle: 135 },
    { start: '#84CC16', end: '#10B981', angle: 135 },
  ];

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-1 rounded-xl border border-border bg-accent/30 p-0.5">
        {[
          { id: 'solid' as const, label: 'Solid', icon: Palette },
          { id: 'gradient' as const, label: 'Gradient', icon: Droplets },
          { id: 'image' as const, label: 'Image', icon: Image },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all', active ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Current background preview */}
      <div className="relative h-20 rounded-xl border border-border overflow-hidden">
        <div className="absolute inset-0" style={background.fillType === 'image' && background.imageSrc ? { backgroundImage: `url(${background.imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } :
          background.fillType === 'gradient' && background.gradientStart && background.gradientEnd ? { background: `linear-gradient(${background.gradientAngle || 0}deg, ${background.gradientStart}, ${background.gradientEnd})` } :
          { background: background.color || '#F4F4F5' }} />
        {background.imageSrc && (
          <button onClick={() => setBackgroundImage(null)} className="absolute top-1 right-1 p-1 rounded-full bg-background/80 text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {tab === 'solid' && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Colors</h4>
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button key={c} onClick={() => setBackgroundColor(c)}
                style={{ background: c }}
                className={cn('aspect-square rounded-lg border border-border transition-all hover:scale-110 hover:shadow-md', background.color === c && background.fillType === 'solid' ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : '')}
              />
            ))}
          </div>
          <div className="mt-3">
            <ColorPicker value={background.color || '#F4F4F5'} onChange={setBackgroundColor} />
          </div>
        </div>
      )}

      {tab === 'gradient' && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {presetGradients.map((g, i) => (
              <button key={i} onClick={() => { setGradStart(g.start); setGradEnd(g.end); setGradAngle(g.angle); setBackgroundGradient(g.start, g.end, g.angle); }}
                className="aspect-square rounded-lg border border-border transition-all hover:scale-105 hover:shadow-md"
                style={{ background: `linear-gradient(${g.angle}deg, ${g.start}, ${g.end})` }}
              />
            ))}
          </div>
          <ColorPicker label="Start Color" value={gradStart} onChange={(c) => { setGradStart(c); setBackgroundGradient(c, gradEnd, gradAngle); }} />
          <ColorPicker label="End Color" value={gradEnd} onChange={(c) => { setGradEnd(c); setBackgroundGradient(gradStart, c, gradAngle); }} />
          <Slider label="Angle" value={gradAngle} min={0} max={360} suffix="°" onChange={(v) => { setGradAngle(v); setBackgroundGradient(gradStart, gradEnd, v); }} />
        </div>
      )}

      {tab === 'image' && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border bg-accent/20 cursor-pointer transition-all hover:border-foreground hover:bg-accent/40"
          >
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {uploading ? 'Uploading...' : 'Click to upload background image'}
            </span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
        </div>
      )}
    </div>
  );
}
