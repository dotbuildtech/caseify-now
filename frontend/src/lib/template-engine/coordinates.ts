import type { VisibleBounds, TemplateRenderState } from './types';

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ratio of visible content vs full image dimensions */
export function visibleFillRatio(
  bounds: VisibleBounds | null,
  origW: number,
  origH: number
): { scaleX: number; scaleY: number; offsetX: number; offsetY: number } {
  if (!bounds) {
    return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
  }
  return {
    scaleX: bounds.width / origW,
    scaleY: bounds.height / origH,
    offsetX: bounds.x / origW,
    offsetY: bounds.y / origH,
  };
}

/**
 * Convert a template-space coordinate (0..origW) to the container's
 * visible-area pixel space, accounting for both the container scale
 * AND the visible-bounds crop.
 */
export function templateToScreen(
  templateCoord: number,
  templateSize: number,
  containerSize: number,
  visibleOffset: number,
  visibleSize: number
): number {
  const cropScale = visibleSize / templateSize;
  const inCropSpace = (templateCoord - visibleOffset) / cropScale;
  const screenScale = containerSize / visibleSize;
  return inCropSpace * screenScale;
}

/**
 * Transform an editable area from template coordinates (original image space)
 * into screen pixel values for a given render state.
 *
 * Uses `background-size: contain` scaling logic — the image (or its visible
 * bounds) is scaled uniformly to fit within the container, and any leftover
 * space is centered (letterboxing).  The returned rect accounts for both the
 * uniform scale and the centering offset so the editable area stays pinned
 * to the same position on the image regardless of the container's aspect
 * ratio.
 */
export function areaToScreenRect(
  area: { x: number; y: number; width: number; height: number },
  state: TemplateRenderState
): ScreenRect {
  const { containerWidth: cw, containerHeight: ch, originalWidth: ow, originalHeight: oh, visibleBounds: vb } = state;

  // Effective image bounds — if visibleBounds is set, use those (crop transparent margins)
  const effW = vb ? vb.width : ow;
  const effH = vb ? vb.height : oh;
  const effOX = vb ? vb.x : 0;
  const effOY = vb ? vb.y : 0;

  // Uniform "contain" scale — same as CSS background-size: contain
  const scale = Math.min(cw / effW, ch / effH);
  const imgW = effW * scale;
  const imgH = effH * scale;

  // Centering offset (letterboxing)
  const offX = (cw - imgW) / 2;
  const offY = (ch - imgH) / 2;

  return {
    x: offX + (area.x - effOX) * scale,
    y: offY + (area.y - effOY) * scale,
    width: area.width * scale,
    height: area.height * scale,
  };
}

/**
 * Uniform scale factor for border-radius / stroke-width / font-size etc.
 * Matches the scale used by areaToScreenRect.
 */
export function areaScale(state: TemplateRenderState): number {
  const { containerWidth: cw, containerHeight: ch, originalWidth: ow, originalHeight: oh, visibleBounds: vb } = state;
  const effW = vb ? vb.width : ow;
  const effH = vb ? vb.height : oh;
  return Math.min(cw / effW, ch / effH);
}
