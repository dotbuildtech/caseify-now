import api from './api';

const MOCK_BRANDS = [
    'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Nothing', 'Motorola'
];

const MOCK_MODELS = {
    Apple: [
        { id: 'iphone-16-pro-max', label: 'iPhone 16 Pro Max', size: '6.9"', cameraCutout: { x: 32, y: 9, w: 36, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-16-pro', label: 'iPhone 16 Pro', size: '6.3"', cameraCutout: { x: 32, y: 9, w: 36, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-16-plus', label: 'iPhone 16 Plus', size: '6.7"', cameraCutout: { x: 27, y: 9, w: 46, h: 6 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-16', label: 'iPhone 16', size: '6.1"', cameraCutout: { x: 27, y: 9, w: 46, h: 6 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-16e', label: 'iPhone 16e', size: '6.1"', cameraCutout: { x: 27, y: 9, w: 46, h: 6 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max', size: '6.7"', cameraCutout: { x: 32, y: 9, w: 36, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-15-pro', label: 'iPhone 15 Pro', size: '6.1"', cameraCutout: { x: 32, y: 9, w: 36, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-15-plus', label: 'iPhone 15 Plus', size: '6.7"', cameraCutout: { x: 27, y: 9, w: 46, h: 6 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-15', label: 'iPhone 15', size: '6.1"', cameraCutout: { x: 27, y: 9, w: 46, h: 6 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-14-pro-max', label: 'iPhone 14 Pro Max', size: '6.7"', cameraCutout: { x: 32, y: 9, w: 36, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-14-pro', label: 'iPhone 14 Pro', size: '6.1"', cameraCutout: { x: 32, y: 9, w: 36, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-14-plus', label: 'iPhone 14 Plus', size: '6.7"', cameraCutout: { x: 27, y: 9, w: 46, h: 6 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-14', label: 'iPhone 14', size: '6.1"', cameraCutout: { x: 27, y: 9, w: 46, h: 6 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'iphone-se-3rd-gen-2022', label: 'iPhone SE (2022)', size: '4.7"', cameraCutout: { x: 25, y: 9, w: 50, h: 7 }, safeZone: { top: 3, bottom: 3, left: 3, right: 3 } },
    ],
    Samsung: [
        { id: 'galaxy-s25-ultra', label: 'Galaxy S25 Ultra', size: '6.9"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s25-plus', label: 'Galaxy S25+', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s25', label: 'Galaxy S25', size: '6.2"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s25-edge', label: 'Galaxy S25 Edge', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s24-ultra', label: 'Galaxy S24 Ultra', size: '6.8"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s24-plus', label: 'Galaxy S24+', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s24', label: 'Galaxy S24', size: '6.2"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s24-fe', label: 'Galaxy S24 FE', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s23-ultra', label: 'Galaxy S23 Ultra', size: '6.8"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s23-plus', label: 'Galaxy S23+', size: '6.6"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s23', label: 'Galaxy S23', size: '6.1"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s23-fe', label: 'Galaxy S23 FE', size: '6.4"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s22-ultra', label: 'Galaxy S22 Ultra', size: '6.8"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s22-plus', label: 'Galaxy S22+', size: '6.6"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-s22', label: 'Galaxy S22', size: '6.1"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-z-fold-6', label: 'Galaxy Z Fold 6', size: '7.6"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-z-fold-5', label: 'Galaxy Z Fold 5', size: '7.6"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-z-fold-4', label: 'Galaxy Z Fold 4', size: '7.6"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-z-flip-6', label: 'Galaxy Z Flip 6', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-z-flip-5', label: 'Galaxy Z Flip 5', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-z-flip-4', label: 'Galaxy Z Flip 4', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a56', label: 'Galaxy A56', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a55', label: 'Galaxy A55', size: '6.6"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a36', label: 'Galaxy A36', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a35', label: 'Galaxy A35', size: '6.6"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a26', label: 'Galaxy A26', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a25', label: 'Galaxy A25', size: '6.5"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a16', label: 'Galaxy A16', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'galaxy-a15', label: 'Galaxy A15', size: '6.5"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
    Google: [
        { id: 'pixel-9-pro-xl', label: 'Pixel 9 Pro XL', size: '6.8"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-9-pro', label: 'Pixel 9 Pro', size: '6.3"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-9', label: 'Pixel 9', size: '6.3"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-9-pro-fold', label: 'Pixel 9 Pro Fold', size: '8.0"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-8-pro', label: 'Pixel 8 Pro', size: '6.7"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-8', label: 'Pixel 8', size: '6.2"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-8a', label: 'Pixel 8a', size: '6.1"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-7-pro', label: 'Pixel 7 Pro', size: '6.7"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-7', label: 'Pixel 7', size: '6.3"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-7a', label: 'Pixel 7a', size: '6.1"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'pixel-fold', label: 'Pixel Fold', size: '7.6"', cameraCutout: { x: 48, y: 8, w: 4, h: 4 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
    OnePlus: [
        { id: 'oneplus-13', label: 'OnePlus 13', size: '6.82"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-13r', label: 'OnePlus 13R', size: '6.78"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-12', label: 'OnePlus 12', size: '6.82"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-12r', label: 'OnePlus 12R', size: '6.78"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-11', label: 'OnePlus 11', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-11r', label: 'OnePlus 11R', size: '6.74"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-10-pro', label: 'OnePlus 10 Pro', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-10t', label: 'OnePlus 10T', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oneplus-nord-4', label: 'OnePlus Nord 4', size: '6.74"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
    Xiaomi: [
        { id: 'xiaomi-14-ultra', label: 'Xiaomi 14 Ultra', size: '6.73"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'xiaomi-14', label: 'Xiaomi 14', size: '6.36"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'xiaomi-14t-pro', label: 'Xiaomi 14T Pro', size: '6.67"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'redmi-note-13-pro-plus', label: 'Redmi Note 13 Pro+', size: '6.67"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'poco-x7-pro', label: 'POCO X7 Pro', size: '6.67"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'poco-f6', label: 'POCO F6', size: '6.67"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
    Nothing: [
        { id: 'nothing-phone-3a', label: 'Nothing Phone (3a)', size: '6.77"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'nothing-phone-2a-plus', label: 'Nothing Phone (2a) Plus', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'nothing-phone-2a', label: 'Nothing Phone (2a)', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'nothing-phone-2', label: 'Nothing Phone (2)', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'nothing-phone-1', label: 'Nothing Phone (1)', size: '6.55"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
    Motorola: [
        { id: 'moto-edge-50-ultra', label: 'Moto Edge 50 Ultra', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'moto-edge-50-pro', label: 'Moto Edge 50 Pro', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'moto-edge-50-fusion', label: 'Moto Edge 50 Fusion', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'moto-edge-40-pro', label: 'Moto Edge 40 Pro', size: '6.67"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'moto-razr-50-ultra', label: 'Moto Razr 50 Ultra', size: '6.9"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
    Oppo: [
        { id: 'oppo-find-x8-pro', label: 'Oppo Find X8 Pro', size: '6.78"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oppo-find-x8', label: 'Oppo Find X8', size: '6.59"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oppo-reno-12-pro', label: 'Oppo Reno 12 Pro', size: '6.7"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'oppo-find-n3-flip', label: 'Oppo Find N3 Flip', size: '6.8"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
    Vivo: [
        { id: 'vivo-x200-pro', label: 'Vivo X200 Pro', size: '6.78"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'vivo-x200', label: 'Vivo X200', size: '6.67"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'vivo-x100-pro', label: 'Vivo X100 Pro', size: '6.78"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
        { id: 'vivo-v40-pro', label: 'Vivo V40 Pro', size: '6.78"', cameraCutout: { x: 47, y: 9, w: 5.5, h: 5.5 }, safeZone: { top: 4, bottom: 4, left: 3, right: 3 } },
    ],
};

const MOCK_MATERIALS = [
    { id: 'matte-hard', label: 'Matte Hard Case', price: 399, swatch: '#1a1a1a', description: 'Slim matte finish, lightweight', image: 'https://images.unsplash.com/photo-1617957688798-4e8e4b8b2c6e?w=200&h=200&fit=crop&q=70', bezel: '#1a1a1a', stock: 120 },
    { id: 'glossy-hard', label: 'Glossy Hard Case', price: 349, swatch: '#0a0a0a', description: 'High-gloss, vibrant colors', image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&h=200&fit=crop&q=70', bezel: '#0a0a0a', stock: 85 },
    { id: 'soft-silicone', label: 'Soft Silicone', price: 449, swatch: '#2d2d2d', description: 'Flexible, grippy, shock absorbent', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop&q=70', bezel: '#1a1a1a', stock: 200 },
    { id: 'clear-tpu', label: 'Clear TPU', price: 299, swatch: '#e8e8e8', description: 'Crystal clear, anti-yellow', image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&h=200&fit=crop&q=70', bezel: '#d0d0d0', stock: 150 },
    { id: 'leather-premium', label: 'Premium Leather', price: 899, swatch: '#5c2e1f', description: 'Genuine Italian leather', image: 'https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?w=200&h=200&fit=crop&q=70', bezel: '#3a1d17', stock: 40 },
    { id: 'carbon-fiber', label: 'Carbon Fiber', price: 799, swatch: '#2a2a2a', description: 'Real carbon fiber weave', image: 'https://images.unsplash.com/photo-1533034705054-79c1920a4f7f?w=200&h=200&fit=crop&q=70', bezel: '#1a1a1a', stock: 25 },
    { id: 'wood-veneer', label: 'Wood Veneer', price: 699, swatch: '#8b6914', description: 'Real wood grain finish', image: 'https://images.unsplash.com/photo-1506905925773-3e99b38b1603?w=200&h=200&fit=crop&q=70', bezel: '#5c3a0a', stock: 15 },
    { id: 'metal-brushed', label: 'Brushed Metal', price: 649, swatch: '#b8b8c0', description: 'Aluminium brushed surface', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&h=200&fit=crop&q=70', bezel: '#8a8a90', stock: 60 }
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const fetchBrands = async () => {
    try {
        const { data } = await api.get('/studio/brands');
        return data.data || data;
    } catch {
        return MOCK_BRANDS;
    }
};

export const fetchModelsByBrand = async (brand) => {
    if (!brand) return [];
    try {
        const { data } = await api.get(`/studio/models?brand=${encodeURIComponent(brand)}`);
        return data.data || data;
    } catch {
        await delay(150);
        return MOCK_MODELS[brand] || [];
    }
};

export const searchModels = async (query) => {
    if (!query || query.length < 2) return [];
    try {
        const { data } = await api.get(`/studio/models/search?q=${encodeURIComponent(query)}`);
        return data.data || data;
    } catch {
        await delay(100);
        const q = query.toLowerCase();
        const results = [];
        Object.entries(MOCK_MODELS).forEach(([brand, models]) => {
            models.forEach((m) => {
                if (m.label.toLowerCase().includes(q) || brand.toLowerCase().includes(q)) {
                    results.push({ ...m, brand });
                }
            });
        });
        return results.slice(0, 15);
    }
};

export const fetchMaterials = async (modelId) => {
    try {
        const { data } = await api.get(`/studio/materials?modelId=${encodeURIComponent(modelId || '')}`);
        return (data.data || data).filter((m) => m.stock > 0);
    } catch {
        await delay(200);
        return MOCK_MATERIALS.filter((m) => m.stock > 0);
    }
};

export const calculatePrice = async ({ modelId, materialId, layerCount, hasText, hasImage }) => {
    try {
        const { data } = await api.post('/studio/calculate-price', { modelId, materialId, layerCount, hasText, hasImage });
        return data.price || data.total || 0;
    } catch {
        const material = MOCK_MATERIALS.find((m) => m.id === materialId);
        const base = material ? material.price : 399;
        const layerFee = layerCount > 2 ? (layerCount - 2) * 25 : 0;
        return base + layerFee;
    }
};

export const fetchTemplates = async () => {
    try {
        const { data } = await api.get('/studio/templates');
        return data.data || data;
    } catch {
        return [
            { id: 'tpl-minimal', label: 'Minimal', thumb: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=300&fit=crop&q=60', layers: [{ type: 'text', text: 'YOUR NAME', x: 50, y: 70, size: 24, color: '#FFFFFF', font: 'sans', rotation: 0, scale: 1, opacity: 1 }], bgColor: '#0A0A0A' },
            { id: 'tpl-floral', label: 'Floral', thumb: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=70' },
            { id: 'tpl-bold', label: 'Bold', thumb: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=300&fit=crop&q=60', layers: [{ type: 'text', text: 'LEGEND', x: 50, y: 50, size: 48, color: '#DC2626', font: 'sans', rotation: 0, scale: 1, opacity: 1, bold: true, uppercase: true }], bgColor: '#FFFFFF' },
            { id: 'tpl-gradient', label: 'Sunset', thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=70' },
            { id: 'tpl-mountain', label: 'Mountain', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=300&fit=crop&q=60', layers: [], bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=70' },
            { id: 'tpl-clean', label: 'Clean', thumb: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&h=300&fit=crop&q=60', layers: [], bgColor: '#F4F4F5' }
        ];
    }
};

const MOCK_MATERIAL_DESIGNS = {
    'matte-hard': [
        { id: 'md-matte-1', name: 'Midnight Gradient', imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=300&h=300&fit=crop&q=70', tags: ['gradient', 'dark', 'minimal'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-matte-2', name: 'Geometric Lines', imageUrl: 'https://images.unsplash.com/photo-1533034705054-79c1920a4f7f?w=300&h=300&fit=crop&q=70', tags: ['geometric', 'pattern', 'modern'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-matte-3', name: 'Cosmic Dust', imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=300&fit=crop&q=70', tags: ['space', 'cosmic', 'stars'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 },
        { id: 'md-matte-4', name: 'Marble Vein', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop&q=70', tags: ['marble', 'stone', 'elegant'], designer: 'DotBuild Studio', isActive: true, sortOrder: 4 },
        { id: 'md-matte-5', name: 'Neon Pulse', imageUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&h=300&fit=crop&q=70', tags: ['neon', 'retro', 'vibrant'], designer: 'DotBuild Studio', isActive: true, sortOrder: 5 },
        { id: 'md-matte-6', name: 'Ocean Waves', imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=300&fit=crop&q=70', tags: ['ocean', 'wave', 'blue'], designer: 'DotBuild Studio', isActive: true, sortOrder: 6 },
        { id: 'md-matte-7', name: 'Mountain Peak', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=300&fit=crop&q=70', tags: ['mountain', 'nature', 'adventure'], designer: 'DotBuild Studio', isActive: true, sortOrder: 7 },
        { id: 'md-matte-8', name: 'Pixel Grid', imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=300&h=300&fit=crop&q=70', tags: ['pixel', 'digital', 'tech'], designer: 'DotBuild Studio', isActive: true, sortOrder: 8 }
    ],
    'glossy-hard': [
        { id: 'md-glossy-1', name: 'Mirror Finish', imageUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=300&h=300&fit=crop&q=70', tags: ['mirror', 'reflective', 'clean'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-glossy-2', name: 'Color Burst', imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop&q=70', tags: ['colorful', 'bright', 'pop'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-glossy-3', name: 'Deep Ocean', imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=300&fit=crop&q=70', tags: ['ocean', 'deep', 'blue'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 },
        { id: 'md-glossy-4', name: 'Sunset Haze', imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=300&fit=crop&q=70', tags: ['sunset', 'warm', 'haze'], designer: 'DotBuild Studio', isActive: true, sortOrder: 4 },
        { id: 'md-glossy-5', name: 'Chrome Silver', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=300&fit=crop&q=70', tags: ['chrome', 'silver', 'metallic'], designer: 'DotBuild Studio', isActive: true, sortOrder: 5 }
    ],
    'soft-silicone': [
        { id: 'md-silicone-1', name: 'Matte Black', imageUrl: 'https://images.unsplash.com/photo-1617957688798-4e8e4b8b2c6e?w=300&h=300&fit=crop&q=70', tags: ['black', 'matte', 'classic'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-silicone-2', name: 'Pastel Dream', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop&q=70', tags: ['pastel', 'soft', 'dreamy'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-silicone-3', name: 'Forest Walk', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&h=300&fit=crop&q=70', tags: ['forest', 'green', 'nature'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 },
        { id: 'md-silicone-4', name: 'Abstract Strokes', imageUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&h=300&fit=crop&q=70', tags: ['abstract', 'art', 'brush'], designer: 'DotBuild Studio', isActive: true, sortOrder: 4 },
        { id: 'md-silicone-5', name: 'Terrazzo Chip', imageUrl: 'https://images.unsplash.com/photo-1533034705054-79c1920a4f7f?w=300&h=300&fit=crop&q=70', tags: ['terrazzo', 'chip', 'textured'], designer: 'DotBuild Studio', isActive: true, sortOrder: 5 },
        { id: 'md-silicone-6', name: 'Watercolor Wash', imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop&q=70', tags: ['watercolor', 'wash', 'artistic'], designer: 'DotBuild Studio', isActive: true, sortOrder: 6 }
    ],
    'clear-tpu': [
        { id: 'md-clear-1', name: 'Crystal Clear', imageUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=300&h=300&fit=crop&q=70', tags: ['clear', 'transparent', 'minimal'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-clear-2', name: 'Frosted Glass', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop&q=70', tags: ['frosted', 'glass', 'matte'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-clear-3', name: 'Iridescent Glow', imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=300&fit=crop&q=70', tags: ['iridescent', 'glow', 'shimmer'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 },
        { id: 'md-clear-4', name: 'Aqua Tint', imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=300&fit=crop&q=70', tags: ['aqua', 'tint', 'blue'], designer: 'DotBuild Studio', isActive: true, sortOrder: 4 }
    ],
    'leather-premium': [
        { id: 'md-leather-1', name: 'Classic Tan', imageUrl: 'https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?w=300&h=300&fit=crop&q=70', tags: ['tan', 'classic', 'brown'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-leather-2', name: 'Dark Espresso', imageUrl: 'https://images.unsplash.com/photo-1529902359512-16326b7e2f70?w=300&h=300&fit=crop&q=70', tags: ['dark', 'espresso', 'luxury'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-leather-3', name: 'Croc Emboss', imageUrl: 'https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?w=300&h=300&fit=crop&q=70', tags: ['croc', 'embossed', 'exotic'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 }
    ],
    'carbon-fiber': [
        { id: 'md-carbon-1', name: 'Stealth Black', imageUrl: 'https://images.unsplash.com/photo-1533034705054-79c1920a4f7f?w=300&h=300&fit=crop&q=70', tags: ['black', 'stealth', 'smooth'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-carbon-2', name: 'Forged Carbon', imageUrl: 'https://images.unsplash.com/photo-1533034705054-79c1920a4f7f?w=300&h=300&fit=crop&q=70', tags: ['forged', 'swirl', 'unique'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-carbon-3', name: 'Red Weave', imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=300&h=300&fit=crop&q=70', tags: ['red', 'weave', 'sport'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 },
        { id: 'md-carbon-4', name: 'Blue Tint Weave', imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=300&fit=crop&q=70', tags: ['blue', 'weave', 'cool'], designer: 'DotBuild Studio', isActive: true, sortOrder: 4 }
    ],
    'wood-veneer': [
        { id: 'md-wood-1', name: 'Dark Walnut', imageUrl: 'https://images.unsplash.com/photo-1506905925773-3e99b38b1603?w=300&h=300&fit=crop&q=70', tags: ['walnut', 'dark', 'classic'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-wood-2', name: 'Light Oak', imageUrl: 'https://images.unsplash.com/photo-1533090161767-e55e98e7e99c?w=300&h=300&fit=crop&q=70', tags: ['oak', 'light', 'natural'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-wood-3', name: 'Bamboo Grain', imageUrl: 'https://images.unsplash.com/photo-1506905925773-3e99b38b1603?w=300&h=300&fit=crop&q=70', tags: ['bamboo', 'grain', 'eco'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 }
    ],
    'metal-brushed': [
        { id: 'md-metal-1', name: 'Silver Brushed', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=300&fit=crop&q=70', tags: ['silver', 'brushed', 'clean'], designer: 'DotBuild Studio', isActive: true, sortOrder: 1 },
        { id: 'md-metal-2', name: 'Rose Gold', imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=300&h=300&fit=crop&q=70', tags: ['rose', 'gold', 'warm'], designer: 'DotBuild Studio', isActive: true, sortOrder: 2 },
        { id: 'md-metal-3', name: 'Space Grey', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=300&fit=crop&q=70', tags: ['grey', 'space', 'dark'], designer: 'DotBuild Studio', isActive: true, sortOrder: 3 },
        { id: 'md-metal-4', name: 'Copper Patina', imageUrl: 'https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?w=300&h=300&fit=crop&q=70', tags: ['copper', 'patina', 'rustic'], designer: 'DotBuild Studio', isActive: true, sortOrder: 4 },
        { id: 'md-metal-5', name: 'Matte Black', imageUrl: 'https://images.unsplash.com/photo-1617957688798-4e8e4b8b2c6e?w=300&h=300&fit=crop&q=70', tags: ['black', 'matte', 'stealth'], designer: 'DotBuild Studio', isActive: true, sortOrder: 5 }
    ]
};

export const fetchMaterialDesigns = async (materialId) => {
    if (!materialId) return [];
    try {
        const { data } = await api.get(`/studio/materials/${encodeURIComponent(materialId)}/designs`);
        return (data.data || data).filter((d) => d.isActive !== false);
    } catch {
        await delay(150);
        return (MOCK_MATERIAL_DESIGNS[materialId] || []).filter((d) => d.isActive);
    }
};
