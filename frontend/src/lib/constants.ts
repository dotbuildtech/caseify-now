export const CUSTOM_PRODUCT_ID = 9999;

export const CANVAS_DEFAULTS = {
  width: 400,
  height: 860,
  scale: 1,
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.1,
};

export const PHONE_ASPECT_RATIO = 9 / 19.5;

export const CAMERA_PRESETS: Record<string, { x: number; y: number; w: number; h: number; type: string }[]> = {
  iphone: [
    { x: 2.5, y: 6, w: 34, h: 15, type: 'square-3' },
    { x: 2.5, y: 6, w: 42, h: 16, type: 'square-2' },
  ],
  samsung: [
    { x: 2, y: 6, w: 24, h: 28, type: 'vertical-3' },
    { x: 2, y: 6, w: 20, h: 24, type: 'vertical-2' },
  ],
  pixel: [
    { x: 2, y: 6, w: 96, h: 11, type: 'bar' },
  ],
  oneplus: [
    { x: 2, y: 6, w: 28, h: 14, type: 'circle' },
  ],
  default: [
    { x: 2, y: 6, w: 28, h: 14, type: 'square-2' },
  ],
};

export const COLOR_PALETTE = [
  '#0A0A0A', '#FFFFFF', '#DC2626', '#EA580C', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#F472B6', '#FCA5A5', '#FED7AA', '#FDE68A', '#A7F3D0', '#A5F3FC',
  '#1E293B', '#334155', '#475569', '#64748B', '#CBD5E1', '#E2E8F0',
  '#F1F5F9', '#F8FAFC', '#450A0A', '#7F1D1D', '#991B1B', '#B91C1C',
];

export const FONT_CATEGORIES = [
  { id: 'popular', name: 'Popular', icon: '⭐' },
  { id: 'serif', name: 'Serif', icon: '✒️' },
  { id: 'sans', name: 'Sans Serif', icon: '📝' },
  { id: 'handwriting', name: 'Handwriting', icon: '✍️' },
  { id: 'display', name: 'Display', icon: '🎨' },
  { id: 'mono', name: 'Monospace', icon: '💻' },
  { id: 'modern', name: 'Modern', icon: '✨' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'luxury', name: 'Luxury', icon: '💎' },
  { id: 'neon', name: 'Neon', icon: '🌆' },
  { id: 'minimal', name: 'Minimal', icon: '◻️' },
];

export const MATERIALS_DATA = [
  { id: 'silicone', label: 'Soft Silicone', price: 0, icon: '🫧', description: 'Flexible, shock-absorbent' },
  { id: 'tpu', label: 'TPU', price: 49, icon: '🛡️', description: 'Durable hybrid material' },
  { id: 'hard', label: 'Hard Plastic', price: 0, icon: '💿', description: 'Rigid polycarbonate' },
  { id: 'matte', label: 'Matte Finish', price: 99, icon: '🌫️', description: 'Soft-touch matte coating' },
  { id: 'glossy', label: 'Glossy Finish', price: 99, icon: '✨', description: 'High-gloss shine' },
  { id: 'transparent', label: 'Transparent', price: 149, icon: '🔮', description: 'Clear see-through case' },
  { id: 'leather', label: 'Premium Leather', price: 299, icon: '👝', description: 'Genuine leather finish' },
  { id: 'wood', label: 'Wood Finish', price: 399, icon: '🪵', description: 'Natural wood texture' },
  { id: 'metal', label: 'Metal Finish', price: 349, icon: '⚙️', description: 'Brushed metal look' },
];

export const SHAPES_DATA = [
  { id: 'rectangle', label: 'Rectangle', icon: '▬' },
  { id: 'circle', label: 'Circle', icon: '○' },
  { id: 'triangle', label: 'Triangle', icon: '△' },
  { id: 'line', label: 'Line', icon: '―' },
  { id: 'arrow', label: 'Arrow', icon: '→' },
  { id: 'star', label: 'Star', icon: '★' },
  { id: 'heart', label: 'Heart', icon: '♥' },
  { id: 'hexagon', label: 'Hexagon', icon: '⬡' },
];

export const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
];

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], action: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['Ctrl', 'C'], action: 'Copy' },
  { keys: ['Ctrl', 'V'], action: 'Paste' },
  { keys: ['Delete', 'Backspace'], action: 'Delete' },
  { keys: ['Ctrl', 'A'], action: 'Select All' },
  { keys: ['Ctrl', 'D'], action: 'Duplicate' },
  { keys: ['Ctrl', 'G'], action: 'Group' },
  { keys: ['Ctrl', 'Shift', 'G'], action: 'Ungroup' },
  { keys: ['Ctrl', 'S'], action: 'Save' },
  { keys: ['Ctrl', 'Plus'], action: 'Zoom In' },
  { keys: ['Ctrl', 'Minus'], action: 'Zoom Out' },
  { keys: ['Ctrl', '0'], action: 'Fit Screen' },
  { keys: ['Arrow'], action: 'Nudge 1px' },
  { keys: ['Shift', 'Arrow'], action: 'Nudge 10px' },
  { keys: ['Ctrl', 'L'], action: 'Lock Layer' },
  { keys: ['Ctrl', 'Shift', 'H'], action: 'Show/Hide Layer' },
];

export const MODIFIER_KEYS = ['ctrl', 'shift', 'alt', 'meta'] as const;

export const HISTORY_LIMIT = 100;
export const AUTOSAVE_INTERVAL = 10000;
export const SAVED_DESIGNS_KEY = 'dotbuild_saved_designs_v2';
export const STUDIO_SETTINGS_KEY = 'dotbuild_studio_settings';
