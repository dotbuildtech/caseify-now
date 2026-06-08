export const PHONE_MODELS = [
    { id: 'iphone-16-pro', label: 'iPhone 16 Pro', size: '6.3"', magSafe: true },
    { id: 'iphone-16', label: 'iPhone 16', size: '6.1"', magSafe: true },
    { id: 'iphone-15-pro', label: 'iPhone 15 Pro', size: '6.1"', magSafe: true },
    { id: 'iphone-15', label: 'iPhone 15', size: '6.1"', magSafe: true },
    { id: 'iphone-14', label: 'iPhone 14', size: '6.1"', magSafe: true },
    { id: 'iphone-se', label: 'iPhone SE', size: '4.7"', magSafe: false },
    { id: 'samsung-s25', label: 'Galaxy S25', size: '6.2"', magSafe: false },
    { id: 'samsung-s24', label: 'Galaxy S24', size: '6.2"', magSafe: false },
    { id: 'pixel-9-pro', label: 'Pixel 9 Pro', size: '6.3"', magSafe: true },
    { id: 'pixel-9', label: 'Pixel 9', size: '6.3"', magSafe: true },
    { id: 'oneplus-13', label: 'OnePlus 13', size: '6.82"', magSafe: false },
    { id: 'xiaomi-14', label: 'Xiaomi 14', size: '6.36"', magSafe: false }
];

export const MATERIALS = [
    {
        id: 'impact-matte',
        label: 'Impact — Matte',
        price: 39,
        swatch: '#1f1f23',
        description: 'Soft-touch, military-grade drop protection'
    },
    {
        id: 'glossy-hardshell',
        label: 'Glossy Hardshell',
        price: 34,
        swatch: '#0a0a0a',
        description: 'Sleek, slim, vibrant color reproduction'
    },
    {
        id: 'saffiano-leather',
        label: 'Saffiano Leather',
        price: 64,
        swatch: '#7a3b2e',
        description: 'Italian textured leather, premium feel'
    },
    {
        id: 'aurora-translucent',
        label: 'Aurora Translucent',
        price: 49,
        swatch: '#9ad7ff',
        description: 'Frosted translucent with iridescent sheen'
    }
];

export const BASE_PRICE = 39;

export const STICKERS = [
    { id: 'star', label: '★ Star', emoji: '⭐' },
    { id: 'heart', label: 'Heart', emoji: '❤️' },
    { id: 'fire', label: 'Fire', emoji: '🔥' },
    { id: 'sparkle', label: 'Sparkle', emoji: '✨' },
    { id: 'sun', label: 'Sun', emoji: '☀️' },
    { id: 'flower', label: 'Flower', emoji: '🌸' },
    { id: 'leaf', label: 'Leaf', emoji: '🍃' },
    { id: 'cloud', label: 'Cloud', emoji: '☁️' },
    { id: 'rainbow', label: 'Rainbow', emoji: '🌈' },
    { id: 'moon', label: 'Moon', emoji: '🌙' },
    { id: 'cat', label: 'Cat', emoji: '🐱' },
    { id: 'dog', label: 'Dog', emoji: '🐶' }
];

export const PHOTO_PRESETS = [
    { id: 'floral', label: 'Floral', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=70' },
    { id: 'gradient', label: 'Gradient', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=400&q=70' },
    { id: 'mountain', label: 'Mountain', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=70' },
    { id: 'ocean', label: 'Ocean', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=400&q=70' },
    { id: 'forest', label: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=70' },
    { id: 'sky', label: 'Sky', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=400&q=70' },
    { id: 'city', label: 'City', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=400&q=70' },
    { id: 'texture', label: 'Texture', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=400&q=70' }
];

export const FONTS = [
    { id: 'serif', label: 'Serif', family: 'var(--font-display)' },
    { id: 'sans', label: 'Sans', family: 'var(--font-sans)' },
    { id: 'mono', label: 'Mono', family: 'var(--font-mono)' }
];

export const COLOR_PALETTE = [
    '#0A0A0A', '#FFFFFF', '#DC2626', '#EA580C', '#F59E0B', '#84CC16',
    '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    '#F472B6', '#FCA5A5', '#FED7AA', '#FDE68A', '#A7F3D0', '#A5F3FC'
];

export const getMaterialById = (id) => MATERIALS.find((m) => m.id === id) || MATERIALS[0];
export const getPhoneById = (id) => PHONE_MODELS.find((p) => p.id === id) || PHONE_MODELS[0];
export const getStickerById = (id) => STICKERS.find((s) => s.id === id);
