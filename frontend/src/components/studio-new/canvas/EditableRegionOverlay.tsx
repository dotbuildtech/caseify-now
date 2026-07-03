'use client';
import { useMemo } from 'react';
import type { EditableAreaData } from '@/types/studio';

interface EditableRegionOverlayProps {
  regions: EditableAreaData[];
  containerWidth: number;
  containerHeight: number;
  templateWidth: number;
  templateHeight: number;
  onRegionClick?: (region: EditableAreaData) => void;
  activeRegionId?: number | null;
}

function getRegionRadius(region: EditableAreaData, scale: number): string {
  const all = region.borderRadius || 0;
  const top = region.borderRadiusTop || 0;
  const bottom = region.borderRadiusBottom || 0;
  if (all > 0 && top === 0 && bottom === 0) {
    const br = all * scale;
    return `${br}px`;
  }
  if (top > 0 && bottom > 0) {
    return `${top * scale}px ${top * scale}px ${bottom * scale}px ${bottom * scale}px`;
  }
  if (top > 0) {
    const br = top * scale;
    return `${br}px ${br}px 0 0`;
  }
  if (bottom > 0) {
    const br = bottom * scale;
    return `0 0 ${br}px ${br}px`;
  }
  if (all > 0) {
    const br = all * scale;
    return `${br}px`;
  }
  return '0';
}

function polygonClipPath(x: number, y: number, w: number, h: number, sides: number): string {
  const cx = x + w / 2, cy = y + h / 2;
  const rx = w / 2, ry = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * (360 / sides) - 90) * Math.PI / 180;
    pts.push(`${cx + rx * Math.cos(angle)}px ${cy + ry * Math.sin(angle)}px`);
  }
  return `polygon(${pts.join(', ')})`;
}

export default function EditableRegionOverlay({
  regions,
  containerWidth,
  containerHeight,
  templateWidth,
  templateHeight,
  onRegionClick,
  activeRegionId,
}: EditableRegionOverlayProps) {
  const scaleX = containerWidth / templateWidth;
  const scaleY = containerHeight / templateHeight;

  const clipPathRegions = useMemo(() => {
    return regions.filter((r) => r.isEnabled && r.isVisible);
  }, [regions]);

  const clipPaths = useMemo(() => {
    return clipPathRegions
      .map((region) => {
        const x = region.x * scaleX;
        const y = region.y * scaleY;
        const w = region.width * scaleX;
        const h = region.height * scaleY;

        if (region.shapeType === 'circle') {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const r = Math.min(w, h) / 2;
          return `circle(${r}px at ${cx}px ${cy}px)`;
        }
        if (region.shapeType === 'rounded_rectangle') {
          const radius = getRegionRadius(region, Math.min(scaleX, scaleY));
          return `inset(${y}px ${containerWidth - x - w}px ${containerHeight - y - h}px ${x}px round ${radius})`;
        }
        if (region.shapeType === 'polygon') {
          return polygonClipPath(x, y, w, h, region.polygonSides || 3);
        }
        return `inset(${y}px ${containerWidth - x - w}px ${containerHeight - y - h}px ${x}px)`;
      })
      .join(', ');
  }, [clipPathRegions, scaleX, scaleY, containerWidth, containerHeight]);

  if (!regions.length) return null;

  return (
    <>
      {/* Invisible hit areas for clicking on regions */}
      {clipPathRegions.map((region) => {
        const radius = getRegionRadius(region, Math.min(scaleX, scaleY));
        const lx = region.x * scaleX;
        const ly = region.y * scaleY;
        const lw = region.width * scaleX;
        const lh = region.height * scaleY;
        const isPolygon = region.shapeType === 'polygon';
        return (
          <div
            key={region.id}
            className="absolute z-20 cursor-pointer group"
            style={{
              left: lx,
              top: ly,
              width: lw,
              height: lh,
              transform: `rotate(${region.rotation || 0}deg)`,
              borderRadius: isPolygon ? undefined : radius,
              clipPath: isPolygon ? polygonClipPath(0, 0, lw, lh, region.polygonSides || 3) : undefined,
            }}
            onClick={() => onRegionClick?.(region)}
          >
            {/* Active indicator */}
            {activeRegionId === region.id && (
              <div className="absolute inset-0 border-2 border-primary rounded-sm pointer-events-none" />
            )}
            {/* Hover indicator */}
            <div className="absolute inset-0 border-2 border-dashed border-primary/0 group-hover:border-primary/40 transition-colors rounded-sm pointer-events-none" />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary/80 text-white text-[8px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {region.name} ({region.areaType})
            </div>
          </div>
        );
      })}

      {/* Clip path layer - applies to child content */}
      {clipPaths && clipPathRegions.length > 0 && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ clipPath: clipPaths }}
        />
      )}

      {/* Dimmed overlay outside editable regions */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.03)',
          clipPath: clipPathRegions
            .map((region) => {
              const x = region.x * scaleX;
              const y = region.y * scaleY;
              const w = region.width * scaleX;
              const h = region.height * scaleY;
              return `inset(${y}px ${containerWidth - x - w}px ${containerHeight - y - h}px ${x}px)`;
            })
            .join(', '),
        }}
      />
    </>
  );
}
