export interface VisibleBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CornerRadii {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface ClipPathResult {
  svgPath: string;
  svgViewBox: string;
}

export interface TemplateRenderState {
  templateImage: string;
  originalWidth: number;
  originalHeight: number;
  visibleBounds: VisibleBounds | null;
  containerWidth: number;
  containerHeight: number;
}

export interface PrintSpec {
  dpi: number;
  widthPx: number;
  heightPx: number;
  bleedPx: number;
  safePx: number;
  cornerRadius: number;
}

export interface LayerRenderData {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  blendMode: string;
  flipX: boolean;
  flipY: boolean;
  data: Record<string, any>;
}

export function defaultCornerRadii(): CornerRadii {
  return { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
}

export function radiiFromArea(area: {
  borderRadius?: number;
  borderRadiusTop?: number;
  borderRadiusBottom?: number;
}): CornerRadii {
  const all = area.borderRadius || 0;
  const top = area.borderRadiusTop || 0;
  const bottom = area.borderRadiusBottom || 0;
  return {
    topLeft: top > 0 ? top : all,
    topRight: top > 0 ? top : all,
    bottomRight: bottom > 0 ? bottom : all,
    bottomLeft: bottom > 0 ? bottom : all,
  };
}
