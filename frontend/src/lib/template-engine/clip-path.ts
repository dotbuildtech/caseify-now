import type { CornerRadii } from './types';

/**
 * Generate an SVG <clipPath> element string for a rounded rectangle
 * with independent corner radii.
 *
 * Arc syntax: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
 */
export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii
): string {
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = radii;

  // Clamp radii to half the smaller dimension
  const maxR = Math.min(w, h) / 2;
  const r1 = Math.min(tl, maxR);
  const r2 = Math.min(tr, maxR);
  const r3 = Math.min(br, maxR);
  const r4 = Math.min(bl, maxR);

  if (r1 === 0 && r2 === 0 && r3 === 0 && r4 === 0) {
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  }

  const parts: string[] = [];

  // Start at top-left corner
  parts.push(`M ${x + r1} ${y}`);

  // Top edge + top-right corner
  parts.push(`L ${x + w - r2} ${y}`);
  if (r2 > 0) {
    parts.push(`A ${r2} ${r2} 0 0 1 ${x + w} ${y + r2}`);
  }

  // Right edge + bottom-right corner
  parts.push(`L ${x + w} ${y + h - r3}`);
  if (r3 > 0) {
    parts.push(`A ${r3} ${r3} 0 0 1 ${x + w - r3} ${y + h}`);
  }

  // Bottom edge + bottom-left corner
  parts.push(`L ${x + r4} ${y + h}`);
  if (r4 > 0) {
    parts.push(`A ${r4} ${r4} 0 0 1 ${x} ${y + h - r4}`);
  }

  // Left edge + back to top-left corner
  parts.push(`L ${x} ${y + r1}`);
  if (r1 > 0) {
    parts.push(`A ${r1} ${r1} 0 0 1 ${x + r1} ${y}`);
  }

  parts.push('Z');
  return parts.join(' ');
}

/**
 * Generate an SVG rect element with optional rx/ry for simple rectangles.
 */
export function rectPath(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

/**
 * Generate an SVG circle/ellipse path.
 */
export function circlePath(cx: number, cy: number, r: number): string {
  const rnd = r * 0.5523; // cubic bezier approximation constant
  return [
    `M ${cx} ${cy - r}`,
    `C ${cx + rnd} ${cy - r}, ${cx + r} ${cy - rnd}, ${cx + r} ${cy}`,
    `C ${cx + r} ${cy + rnd}, ${cx + rnd} ${cy + r}, ${cx} ${cy + r}`,
    `C ${cx - rnd} ${cy + r}, ${cx - r} ${cy + rnd}, ${cx - r} ${cy}`,
    `C ${cx - r} ${cy - rnd}, ${cx - rnd} ${cy - r}, ${cx} ${cy - r}`,
    'Z',
  ].join(' ');
}

/**
 * Generate a regular polygon path (3-6 sides) inscribed in the rect.
 */
export function polygonPath(
  x: number,
  y: number,
  w: number,
  h: number,
  sides: number
): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * (360 / sides) - 90) * (Math.PI / 180);
    pts.push(`${cx + rx * Math.cos(angle)} ${cy + ry * Math.sin(angle)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

/**
 * Generate a clip-path SVG element string for an editable area.
 * Returns the <clipPath> inner content (the path data).
 */
export function generateClipPathData(
  shapeType: string,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii,
  polygonSides?: number | null,
  customPath?: string | null
): string {
  if (customPath) return customPath;

  switch (shapeType) {
    case 'circle': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) / 2;
      return circlePath(cx, cy, r);
    }
    case 'rounded_rectangle':
      return roundedRectPath(x, y, w, h, radii);
    case 'polygon':
      return polygonPath(x, y, w, h, polygonSides || 3);
    case 'custom':
      return customPath || rectPath(x, y, w, h);
    default:
      return rectPath(x, y, w, h);
  }
}

/**
 * Full <clipPath id="..."> SVG string.
 */
export function svgClipPathElement(
  id: string,
  pathData: string
): string {
  return `<clipPath id="${id}"><path d="${pathData}" /></clipPath>`;
}
