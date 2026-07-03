'use client';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { COLOR_PALETTE } from '@/lib/constants';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  showPalette?: boolean;
  showInput?: boolean;
}

export default function ColorPicker({ value, onChange, label, className, showPalette = true, showInput = true }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border-2 border-border ring-offset-background transition-all hover:ring-2 hover:ring-ring"
        >
          <div className="absolute inset-0 rounded-full" style={{ background: value }} />
          <div className="absolute inset-0 rounded-full opacity-0 hover:opacity-10 bg-black" />
        </button>
        {showInput && (
          <input
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-mono outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
          />
        )}
      </div>
      {open && showPalette && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-popover p-3 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setHexInput(c); setOpen(false); }}
                style={{ background: c }}
                className={cn(
                  'aspect-square rounded-lg border border-border transition-all hover:scale-110 hover:shadow-md',
                  value === c && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                )}
                aria-label={c}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => { onChange(e.target.value); setHexInput(e.target.value); }}
              className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
            />
            <span className="text-[10px] text-muted-foreground">Custom</span>
          </div>
        </div>
      )}
    </div>
  );
}
