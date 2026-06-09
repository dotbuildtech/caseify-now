export const SITE = {
    name: 'DotBuild',
    tagline: 'Premium Mobile Accessories',
    contact: {
        phone: '+91 98765 43210',
        email: 'support@dotbuild.example',
        address: '456 Electronics Hub, Bangalore 560001'
    },
    social: { facebook: '', instagram: '', twitter: '' }
};

export const ANNOUNCEMENTS = [
    'FREE SHIPPING ON ORDERS ABOVE ₹500',
    'PREMIUM MOBILE ACCESSORIES',
    'FAST DELIVERY ACROSS INDIA',
    '30-DAY HASSLE-FREE RETURNS'
];

export const MARQUEE = ['Free Shipping', 'Premium Quality', 'Fast Delivery', 'Secure Payment', '30-Day Returns'];

export const CATEGORIES = [
    {
        id: 'mobile-back-covers',
        name: 'Mobile Back Covers',
        deviceSpecific: true,
        icon: 'Smartphone',
        filters: [
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'phoneModel', label: 'Device Model', type: 'select', source: 'models', dependsOn: 'brand' },
            { key: 'material', label: 'Material', type: 'checkbox', options: ['Silicone', 'TPU', 'Polycarbonate', 'Leather', 'Wood', 'Carbon Fiber', 'Acrylic'] },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['Slim Cases', 'Rugged Cases', 'Wallet Cases', 'Clear Cases', 'Flip Covers', 'Designer Cases', 'MagSafe Cases', 'Ultra-Thin Cases']
    },
    {
        id: 'screen-protectors',
        name: 'Screen Protectors',
        deviceSpecific: true,
        icon: 'Shield',
        filters: [
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'phoneModel', label: 'Device Model', type: 'select', source: 'models', dependsOn: 'brand' },
            { key: 'type', label: 'Type', type: 'checkbox', options: ['Tempered Glass', 'Privacy', 'Matte', 'Anti-Glare', 'Camera Lens', 'Full Coverage', 'UV Glass'] },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['Tempered Glass', 'Privacy Guards', 'Matte Guards', 'Camera Lens Protectors', 'Full Coverage', 'UV Glass Protectors']
    },
    {
        id: 'chargers',
        name: 'Chargers',
        deviceSpecific: true,
        icon: 'Zap',
        filters: [
            { key: 'device_type', label: 'Device Type', type: 'select', options: ['Smartphone', 'Laptop', 'Tablet', 'Smartwatch', 'Universal'] },
            { key: 'port_type', label: 'Port Type', type: 'select', options: ['USB-C', 'Lightning', 'USB-A', 'Multi-Port', 'Wireless'] },
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'wattage', label: 'Wattage', type: 'select', options: ['5W', '10W', '15W', '20W', '30W', '45W', '65W', '100W', '140W'] },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['Wall Chargers', 'Wireless Chargers', 'Car Chargers', 'Multi-Port Chargers', 'GaN Chargers', 'Travel Adapters', 'MagSafe Chargers']
    },
    {
        id: 'earphones-earbuds',
        name: 'Earphones & Earbuds',
        deviceSpecific: false,
        icon: 'Headphones',
        filters: [
            { key: 'type', label: 'Type', type: 'select', options: ['TWS Earbuds', 'Wired Earphones', 'Neckbands', 'Bluetooth Headphones', 'Wired Headphones'] },
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['TWS Earbuds', 'Wired Earphones', 'Neckbands', 'Bluetooth Headphones', 'Wired Headphones']
    },
    {
        id: 'power-banks',
        name: 'Power Banks',
        deviceSpecific: false,
        icon: 'Battery',
        filters: [
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'capacity', label: 'Capacity', type: 'select', options: ['5000mAh', '10000mAh', '20000mAh', '30000mAh'] },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['10000mAh', '20000mAh', 'MagSafe Power Banks', 'Mini Compact', 'Solar Power Banks']
    },
    {
        id: 'cables',
        name: 'Cables',
        deviceSpecific: false,
        icon: 'Cable',
        filters: [
            { key: 'cable_type', label: 'Cable Type', type: 'select', options: ['USB-C to USB-C', 'USB-A to USB-C', 'USB-A to Lightning', 'Micro USB', 'OTG', 'HDMI / Hub'] },
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'length', label: 'Length', type: 'select', options: ['0.5m', '1m', '1.5m', '2m', '3m'] },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['USB-C to USB-C', 'USB-A to USB-C', 'USB-A to Lightning', 'Micro USB', 'OTG Adapters', 'HDMI / USB-C Hubs', 'Audio Cables']
    },
    {
        id: 'smart-watches',
        name: 'Smart Watches',
        deviceSpecific: true,
        icon: 'Watch',
        filters: [
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'phoneModel', label: 'Watch Model', type: 'select', source: 'models', dependsOn: 'brand' },
            { key: 'type', label: 'Accessory Type', type: 'select', options: ['Bands', 'Screen Guards', 'Chargers', 'Cases'] },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['Bands', 'Screen Guards', 'Chargers', 'Cases']
    },
    {
        id: 'laptop-accessories',
        name: 'Laptop Accessories',
        deviceSpecific: true,
        icon: 'Monitor',
        filters: [
            { key: 'brand', label: 'Brand', type: 'select', source: 'brands' },
            { key: 'phoneModel', label: 'Laptop Model', type: 'select', source: 'models', dependsOn: 'brand' },
            { key: 'type', label: 'Type', type: 'select', options: ['Laptop Bags', 'Laptop Stands', 'Wireless Mice', 'Keyboards', 'USB Hubs', 'Cleaning Kits'] },
            { key: 'price_range', label: 'Price Range', type: 'range' },
        ],
        subcategories: ['Laptop Bags', 'Laptop Stands', 'Wireless Mice', 'Keyboards', 'USB Hubs', 'Cleaning Kits', 'Screen Protectors']
    }
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
export const SUBCATEGORY_NAMES = CATEGORIES.flatMap((c) => c.subcategories);
export const ALL_CATEGORY_NAMES = [...CATEGORY_NAMES, ...SUBCATEGORY_NAMES];

export const isDeviceSpecificCategory = (name) => {
    const cat = CATEGORIES.find((c) => c.name === name || c.subcategories.includes(name));
    return cat ? cat.deviceSpecific : false;
};

export const getCategoryConfig = (name) => {
    return CATEGORIES.find((c) => c.name === name || c.subcategories.includes(name)) || null;
};

export const CATEGORY_GROUPS = CATEGORIES.reduce((acc, c) => {
    acc[c.name] = {
        deviceSpecific: c.deviceSpecific,
        icon: c.icon,
        subcategories: c.subcategories
    };
    return acc;
}, {});

export const DEVICE_SPECIFIC_CATEGORIES = CATEGORIES.filter((c) => c.deviceSpecific).flatMap((c) => [c.name, ...c.subcategories]);

export const PRODUCT_CATEGORIES = CATEGORIES.flatMap((c) => [c.name, ...c.subcategories]);

export const getCategoryGroup = (name) => {
    for (const cat of CATEGORIES) {
        if (cat.name === name || cat.subcategories.includes(name)) return cat.name;
    }
    return null;
};

export const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/customize', label: 'Studio' },
    { href: '/track', label: 'Track' },
    { href: '/contact', label: 'Contact' }
];

export const TESTIMONIALS = [
    { quote: 'Excellent quality and amazing designs. My phone is protected and looks fantastic.', author: 'Vikram Reddy', role: 'Hyderabad' },
    { quote: 'Fast shipping, great prices, and the case fits perfectly. Highly recommend!', author: 'Neha Sharma', role: 'Mumbai' },
    { quote: 'Customer service is top-notch. Had an issue and they resolved it instantly.', author: 'Arjun Kumar', role: 'Delhi' }
];

export const FEATURES = [
    { title: 'Free Shipping', description: 'Orders above ₹500 shipped free', icon: 'Truck' },
    { title: 'Secure Payments', description: 'UPI, Cards, and Cash on Delivery', icon: 'Shield' },
    { title: '30-Day Returns', description: 'No questions asked return policy', icon: 'Heart' },
    { title: 'Premium Quality', description: 'Tested and certified products only', icon: 'Sparkles' }
];

export const HERO_SLIDES = [
    { title: 'Protect Your Device', subtitle: 'Premium mobile accessories with latest designs.', ctaText: 'Shop Now', ctaLink: '/shop', bg: 'https://images.unsplash.com/photo-1705346738010-d480180032ba?auto=format&fit=crop&w=1200&q=65' },
    { title: 'Design It Yourself', subtitle: 'AI-powered studio to make a case as unique as you.', ctaText: 'Open Studio', ctaLink: '/customize', bg: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=65' },
    { title: 'Summer Sale Now Live', subtitle: 'Up to 50% off on selected premium accessories.', ctaText: 'Shop Deals', ctaLink: '/shop?sort=price_desc', bg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=65' }
];
