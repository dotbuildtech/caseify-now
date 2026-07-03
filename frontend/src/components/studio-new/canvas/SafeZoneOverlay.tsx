'use client';

interface SafeZoneOverlayProps {
  safeZone?: { top: number; bottom: number; left: number; right: number } | null;
  show: boolean;
}

export default function SafeZoneOverlay({ safeZone, show }: SafeZoneOverlayProps) {
  if (!safeZone || !show) return null;

  return (
    <>
      {/* Safe area */}
      <div
        className="pointer-events-none absolute z-20 rounded-[13%]/[7%] border-2 border-dashed border-green-500/40 bg-green-500/5 transition-all duration-300"
        style={{
          top: `${safeZone.top}%`,
          bottom: `${safeZone.bottom}%`,
          left: `${safeZone.left}%`,
          right: `${safeZone.right}%`,
        }}
      >
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold uppercase tracking-wider text-green-500/50">Safe area</span>
      </div>
      {/* Bleed area warning */}
      <div
        className="pointer-events-none absolute inset-0 z-15 rounded-[14%]/[8%] border border-dashed border-red-400/20"
      >
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold uppercase tracking-wider text-red-400/40">Bleed area</span>
      </div>
    </>
  );
}
