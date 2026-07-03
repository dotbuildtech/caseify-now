'use client';
import { useMemo } from 'react';
import type { EditableAreaData, VisibleBoundsData } from '@/types/studio';
import { areaToScreenRect } from '@/lib/template-engine/coordinates';
import { radiiFromArea } from '@/lib/template-engine/types';
import { generateClipPathData } from '@/lib/template-engine/clip-path';

export interface TemplateRendererProps {
  areas: EditableAreaData[];
  children?: React.ReactNode;
  containerWidth: number;
  containerHeight?: number;
  originalWidth?: number;
  originalHeight?: number;
  visibleBounds?: VisibleBoundsData | null;
  showIndicators?: boolean;
  selectedAreaId?: number | null;
  templateImage?: string | null;
}

const HANDLE_SIZE = 10;
const RESIZE_HANDLES = [
  { id: 'nw' as const, cursor: 'nwse-resize', style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
  { id: 'n' as const, cursor: 'ns-resize', style: { top: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2 } },
  { id: 'ne' as const, cursor: 'nesw-resize', style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
  { id: 'e' as const, cursor: 'ew-resize', style: { top: '50%', right: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2 } },
  { id: 'se' as const, cursor: 'nwse-resize', style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
  { id: 's' as const, cursor: 'ns-resize', style: { bottom: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2 } },
  { id: 'sw' as const, cursor: 'nesw-resize', style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
  { id: 'w' as const, cursor: 'ew-resize', style: { top: '50%', left: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2 } },
];

const ORIGINAL_SIZE = 3000;

function polygonPoints(x: number, y: number, w: number, h: number, sides: number): string {
  const cx = x + w / 2, cy = y + h / 2;
  const rx = w / 2, ry = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * (360 / sides) - 90) * Math.PI / 180;
    pts.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

export default function TemplateRenderer({
  areas,
  children,
  containerWidth,
  containerHeight,
  originalWidth = ORIGINAL_SIZE,
  originalHeight = ORIGINAL_SIZE,
  visibleBounds = null,
  showIndicators = false,
  selectedAreaId,
  templateImage,
}: TemplateRendererProps) {
  const validAreas = useMemo(
    () => areas.filter((a) => a.isEnabled && a.isVisible),
    [areas]
  );

  const cw = containerWidth;
  const ch = containerHeight ?? containerWidth;

  const imageScreenRect = useMemo(() => {
    if (!cw || !originalWidth || !originalHeight) return null;
    return areaToScreenRect(
      { x: 0, y: 0, width: originalWidth, height: originalHeight },
      {
        templateImage: '',
        originalWidth,
        originalHeight,
        visibleBounds: null,
        containerWidth: cw,
        containerHeight: ch,
      }
    );
  }, [cw, ch, originalWidth, originalHeight]);

  const scaled = useMemo(() => {
    if (!cw || !originalWidth || !originalHeight) return [];
    const dispScale = Math.min(cw / originalWidth, ch / originalHeight);
    return validAreas.map((area) => {
      const sr = areaToScreenRect(area, {
        templateImage: '',
        originalWidth,
        originalHeight,
        visibleBounds: null,
        containerWidth: cw,
        containerHeight: ch,
      });
      const radii = radiiFromArea(area);
      const scaledRadii = {
        topLeft: radii.topLeft * dispScale,
        topRight: radii.topRight * dispScale,
        bottomRight: radii.bottomRight * dispScale,
        bottomLeft: radii.bottomLeft * dispScale,
      };
      return { sr, area, radii, scaledRadii };
    });
  }, [validAreas, cw, ch, originalWidth, originalHeight]);

  const indicatorRects = useMemo(() => {
    const dispScale = Math.min(cw / originalWidth, ch / originalHeight);
    return scaled.map(({ sr, area, radii }) => {
      const tl = radii.topLeft * dispScale;
      const tr = radii.topRight * dispScale;
      const br = radii.bottomRight * dispScale;
      const bl = radii.bottomLeft * dispScale;
      const radius = [tl, tr, br, bl].every((v) => v === tl)
        ? `${tl}px`
        : `${tl}px ${tr}px ${br}px ${bl}px`;
      const isCustom = area.shapeType === 'custom';
      return { ...sr, area, radius, isPolygon: area.shapeType === 'polygon', isCustom, sides: area.polygonSides || 3 };
    });
    }, [scaled, cw, ch, originalWidth, originalHeight]);

  const compoundClipId = 'template-compound-clip';

  return (
    <>
      {/* Template image rendered using the same coordinate mapping as editable areas.
          This guarantees pixel-perfect alignment between the image and area overlays. */}
      {templateImage && imageScreenRect && (
        <img
          src={templateImage}
          alt=""
          crossOrigin="anonymous"
          className="absolute pointer-events-none select-none"
          style={{
            left: imageScreenRect.x,
            top: imageScreenRect.y,
            width: imageScreenRect.width,
            height: imageScreenRect.height,
          }}
          draggable={false}
        />
      )}

      {/* 
        Full-size SVG defining the compound clip-path.
        Uses the SAME dimensions as the container so clipPath
        userSpaceOnUse coordinates map 1:1 to the content div.
      */}
      {cw > 0 && validAreas.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={compoundClipId}>
              {scaled.map(({ sr, area, scaledRadii }) => {
                if (area.shapeType === 'custom' && area.pathData) {
                  return (
                    <path
                      key={area.id ?? area.name}
                      d={area.pathData}
                      transform={`translate(${sr.x}, ${sr.y}) scale(${sr.width}, ${sr.height})`}
                    />
                  );
                }
                return (
                  <path
                    key={area.id ?? area.name}
                    d={generateClipPathData(
                      area.shapeType,
                      sr.x, sr.y, sr.width, sr.height,
                      scaledRadii,
                      area.polygonSides
                    )}
                  />
                );
              })}
            </clipPath>
          </defs>
        </svg>
      )}

      {/* Content clipped to compound clip-path via same-document url() reference */}
      {children && (
        <div
          className="absolute inset-0"
          style={{ clipPath: `url(#${compoundClipId})` }}
        >
          {children}
        </div>
      )}

      {/* Area indicators */}
      {showIndicators && indicatorRects.map((rect) => {
        const isSel = rect.area.id === selectedAreaId;
        return (
          <div
            key={`indicator-${rect.area.id}`}
            className="absolute pointer-events-none"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderRadius: rect.isPolygon || rect.isCustom ? undefined : rect.radius,
            }}
          >
            {rect.isPolygon ? (
              <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${rect.width} ${rect.height}`}>
                <polygon
                  points={polygonPoints(0, 0, rect.width, rect.height, rect.sides)}
                  fill={isSel ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'}
                  stroke={isSel ? '#3b82f6' : 'rgba(59,130,246,0.5)'}
                  strokeWidth={isSel ? 2 : 1}
                  strokeDasharray={isSel ? 'none' : '4 3'}
                />
              </svg>
            ) : rect.isCustom && rect.area.pathData ? (
              <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 1 1`}>
                <path
                  d={rect.area.pathData}
                  fill={isSel ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'}
                  stroke={isSel ? '#3b82f6' : 'rgba(59,130,246,0.5)'}
                  strokeWidth={isSel ? 0.01 : 0.005}
                />
              </svg>
            ) : (
              <div
                className={`absolute inset-0 ${isSel ? 'bg-primary/15 ring-2 ring-primary' : 'bg-primary/8 border border-dashed border-primary/50'}`}
                style={{ borderRadius: rect.radius }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
