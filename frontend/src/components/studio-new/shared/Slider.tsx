'use client';
import { cn } from '@/lib/utils';

interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
  className?: string;
}

export default function Slider({ label, value, min = 0, max = 100, step = 1, onChange, suffix, className }: SliderProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{value}{suffix}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-foreground
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
  );
}
