'use client';

interface SafeZoneOverlayProps {
  safeZoneTop?: number;
  safeZoneBottom?: number;
  safeZoneLeft?: number;
  safeZoneRight?: number;
  bleedPx?: number;
  cornerRadius?: number;
  showSafeZone: boolean;
  showBleedArea: boolean;
  templateWidth?: number;
  templateHeight?: number;
}

export default function SafeZoneOverlay({
  safeZoneTop = 5,
  safeZoneBottom = 5,
  safeZoneLeft = 5,
  safeZoneRight = 5,
  bleedPx = 3,
  cornerRadius = 42,
  showSafeZone,
  showBleedArea,
  templateWidth = 2400,
  templateHeight = 5200,
}: SafeZoneOverlayProps) {
  const safePct = (px: number, total: number) => (px / total) * 100;

  const szTop = safePct(safeZoneTop, templateHeight);
  const szBottom = safePct(safeZoneBottom, templateHeight);
  const szLeft = safePct(safeZoneLeft, templateWidth);
  const szRight = safePct(safeZoneRight, templateWidth);

  return (
    <>
      {showSafeZone && (
        <div
          className="pointer-events-none absolute z-20 border-2 border-dashed border-green-500/40 bg-green-500/5 transition-all duration-300"
          style={{
            top: `${szTop}%`,
            bottom: `${szBottom}%`,
            left: `${szLeft}%`,
            right: `${szRight}%`,
            borderRadius: `${cornerRadius * 0.85}px`,
          }}
        >
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold uppercase tracking-wider text-green-500/50">
            Safe area
          </span>
        </div>
      )}
      {showBleedArea && (
        <div className="pointer-events-none absolute inset-0 z-15 border border-dashed border-red-400/20"
          style={{ borderRadius: `${cornerRadius + bleedPx * 4}px` }}
        >
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold uppercase tracking-wider text-red-400/40">
            Bleed area
          </span>
        </div>
      )}
    </>
  );
}
