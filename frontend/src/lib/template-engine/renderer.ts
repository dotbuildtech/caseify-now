import type { CanvasLayer, BackgroundLayer, EditableAreaData } from '@/types/studio';

export interface CanvasLayerStack {
  mockup: string | null;
  mask: string | null;
  safeArea: string | null;
  bleed: string | null;
  cameraCutout: string | null;
  preview: string | null;
  templateImage: string | null;
  background: BackgroundLayer;
  layers: CanvasLayer[];
  editableAreas: EditableAreaData[];
}

export function buildLayerStack(
  templateImage: string | null,
  maskSvg: string | null,
  safeAreaSvg: string | null,
  bleedSvg: string | null,
  cameraCutoutSvg: string | null,
  previewImage: string | null,
  background: BackgroundLayer,
  layers: CanvasLayer[],
  editableAreas: EditableAreaData[]
): CanvasLayerStack {
  return {
    mockup: previewImage,
    mask: maskSvg,
    safeArea: safeAreaSvg,
    bleed: bleedSvg,
    cameraCutout: cameraCutoutSvg,
    preview: previewImage,
    templateImage,
    background,
    layers,
    editableAreas,
  };
}

export function generateCameraClipPath(cameraCutoutSvg: string): string {
  return `url(#camera-clip)`;
}

export function generateMaskClipPath(maskSvg: string): string {
  return `url(#phone-mask)`;
}

export function templateCoordsToCanvasStyle(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  templateWidth: number,
  templateHeight: number,
  canvasWidth: number,
  canvasHeight: number
): React.CSSProperties {
  const scaleX = canvasWidth / templateWidth;
  const scaleY = canvasHeight / templateHeight;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (canvasWidth - templateWidth * scale) / 2;
  const offsetY = (canvasHeight - templateHeight * scale) / 2;

  return {
    position: 'absolute',
    left: offsetX + x * scale,
    top: offsetY + y * scale,
    width: width * scale,
    height: height * scale,
    transform: `rotate(${rotation}deg)`,
  };
}
