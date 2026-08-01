import type { VisibleBounds, TemplateRenderState } from './types';

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

export function areaToScreenRect(
  area: { x: number; y: number; width: number; height: number },
  state: TemplateRenderState
): ScreenRect {
  const { containerWidth: cw, containerHeight: ch, originalWidth: ow, originalHeight: oh, visibleBounds: vb } = state;

  const effW = vb ? vb.width : ow;
  const effH = vb ? vb.height : oh;
  const effOX = vb ? vb.x : 0;
  const effOY = vb ? vb.y : 0;

  const scale = Math.min(cw / effW, ch / effH);
  const imgW = effW * scale;
  const imgH = effH * scale;

  const offX = (cw - imgW) / 2;
  const offY = (ch - imgH) / 2;

  return {
    x: offX + (area.x - effOX) * scale,
    y: offY + (area.y - effOY) * scale,
    width: area.width * scale,
    height: area.height * scale,
  };
}

export function areaScale(state: TemplateRenderState): number {
  const { containerWidth: cw, containerHeight: ch, originalWidth: ow, originalHeight: oh, visibleBounds: vb } = state;
  const effW = vb ? vb.width : ow;
  const effH = vb ? vb.height : oh;
  return Math.min(cw / effW, ch / effH);
}

export function templateToPrint(
  templateValue: number,
  templateSize: number,
  printSize: number
): number {
  return (templateValue / templateSize) * printSize;
}

export function screenToTemplate(
  screenValue: number,
  containerSize: number,
  templateSize: number,
  zoom: number
): number {
  return (screenValue / (containerSize * zoom)) * templateSize;
}

export function getPrintDimensions(
  templateWidth: number,
  templateHeight: number,
  dpi: number = 300,
  scale: number = 1
): { width: number; height: number } {
  const ppi = templateWidth > 10000 ? templateWidth : (templateWidth / 6) * dpi / 25.4;
  const ratio = templateWidth / templateHeight;
  let w = Math.round(templateWidth * scale);
  let h = Math.round(templateHeight * scale);
  return { width: w, height: h };
}
