export type LayerType = 'text' | 'image' | 'sticker' | 'shape' | 'qrcode' | 'background';

export type ToolType = 'select' | 'upload' | 'text' | 'stickers' | 'shapes' | 'background' | 'templates' | 'qr' | 'ai' | 'saved';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'star' | 'heart' | 'hexagon';

export type DeviceType = 'phone' | 'smartwatch' | 'laptop' | 'tablet' | 'earbuds';

export type MaterialType = 'silicone' | 'tpu' | 'hard' | 'matte' | 'glossy' | 'transparent' | 'leather' | 'wood' | 'metal';

export type FontCategory = 'serif' | 'sans' | 'handwriting' | 'display' | 'mono' | 'modern' | 'gaming' | 'luxury' | 'neon' | 'minimal';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light';

export type Alignment = 'left' | 'center' | 'right' | 'justify';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hue: number;
  sepia: number;
  grayscale: number;
}

export interface Shadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Border {
  enabled: boolean;
  color: string;
  width: number;
  radius: number;
}

export interface TextLayer {
  id: string;
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  gradient?: { enabled: boolean; startColor: string; endColor: string; angle: number };
  stroke?: { enabled: boolean; color: string; width: number };
  shadow?: Shadow;
  alignment: Alignment;
  uppercase: boolean;
  curved: boolean;
  curveRadius: number;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  name: string;
  blendMode: BlendMode;
  flipX: boolean;
  flipY: boolean;
}

export interface ImageLayer {
  id: string;
  type: 'image';
  src: string;
  originalSrc: string;
  crop?: { x: number; y: number; width: number; height: number };
  filters: Filters;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  name: string;
  blendMode: BlendMode;
  flipX: boolean;
  flipY: boolean;
  shadow?: Shadow;
  border?: Border;
  cornerRadius: number;
  mask?: string;
}

export interface StickerLayer {
  id: string;
  type: 'sticker';
  stickerId: string;
  emoji: string;
  category: string;
  color?: string;
  size: number;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  name: string;
  blendMode: BlendMode;
  flipX: boolean;
  flipY: boolean;
}

export interface ShapeLayer {
  id: string;
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  name: string;
  blendMode: BlendMode;
  shadow?: Shadow;
  cornerRadius: number;
}

export interface QRCodeLayer {
  id: string;
  type: 'qrcode';
  data: string;
  color: string;
  bgColor: string;
  size: number;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  name: string;
}

export interface BackgroundLayer {
  id: string;
  type: 'background';
  fillType: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  imageSrc?: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  name: string;
}

export type CanvasLayer = TextLayer | ImageLayer | StickerLayer | ShapeLayer | QRCodeLayer | BackgroundLayer;

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface DeviceModel {
  id: string;
  name: string;
  slug: string;
  brand: string;
  deviceType: DeviceType;
  size?: string;
  releaseYear?: number;
}

export interface DeviceTemplate {
  id: number;
  deviceModelId: number;
  caseWidth: number;
  caseHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  bleedArea: number;
  cornerRadius: number;
  cameraX: number;
  cameraY: number;
  cameraWidth: number;
  cameraHeight: number;
  previewImage?: string;
  svgMask?: string;
  thumbnail?: string;
  basePrice: number;
}

export interface Material {
  id: string;
  name: string;
  slug: string;
  label: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
  bezel?: string;
  description?: string;
  texture?: string;
}

export interface HistoryEntry {
  layers: CanvasLayer[];
  timestamp: number;
  description: string;
}

export interface FontItem {
  id: string;
  family: string;
  category: FontCategory;
  variants: string[];
  popular: boolean;
}

export interface StickerCategory {
  id: string;
  name: string;
  icon: string;
  stickers: StickerItem[];
}

export interface StickerItem {
  id: string;
  emoji: string;
  label: string;
  category: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: string;
  brand?: string;
  modelId?: string;
  materialId?: string;
  layers: CanvasLayer[];
  background: BackgroundLayer;
  preview?: string;
}

export interface PriceBreakdown {
  base: number;
  material: number;
  premiumPrint: number;
  expressDelivery: number;
  discount: number;
  couponCode?: string;
  total: number;
}

// Template & Editable Area types
export type AreaType = 'image' | 'text' | 'logo' | 'qr_code' | 'sticker' | 'mixed';
export type AreaShapeType = 'rectangle' | 'circle' | 'rounded_rectangle' | 'polygon' | 'custom';

export interface EditableAreaData {
  id?: number;
  studioTemplateId?: number;
  name: string;
  areaType: AreaType;
  shapeType: AreaShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  borderRadius: number;
  borderRadiusTop: number;
  borderRadiusBottom: number;
  polygonSides?: number | null;
  pathData?: string | null;
  minZoom?: number | null;
  maxZoom?: number | null;
  allowRotation: boolean;
  allowFlip: boolean;
  lockAspectRatio: boolean;
  isRequired: boolean;
  isVisible: boolean;
  isEnabled: boolean;
  placeholderImage?: string | null;
  maxUploadSize?: number | null;
  acceptedFileTypes?: string | null;
  backgroundColor?: string | null;
  guideText?: string | null;
  zIndex: number;
  opacity: number;
  notes?: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisibleBoundsData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StudioTemplateData {
  id?: number;
  studioProductId: number;
  templateImage: string;
  originalWidth: number;
  originalHeight: number;
  visibleBounds?: VisibleBoundsData | null;
  previewImage?: string | null;
  thumbnailImage?: string | null;
  printImage?: string | null;
  metadata?: Record<string, any>;
  editableAreas?: EditableAreaData[];
  assets?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateAssetData {
  id?: number;
  studioTemplateId: number;
  editableAreaId?: number | null;
  assetType: 'image' | 'svg' | 'font' | 'overlay';
  url: string;
  thumbnailUrl?: string | null;
  metadata?: Record<string, any>;
  sortOrder: number;
}

export interface StudioSettings {
  showGrid: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  showSafeZone: boolean;
  showBleedArea: boolean;
  zoom: number;
  panX: number;
  panY: number;
  darkMode: boolean;
  rulerEnabled: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}
