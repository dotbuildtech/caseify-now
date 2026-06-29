export const SITE = {
    name: 'Caseify Now',
    tagline: 'Premium Mobile Accessories',
    contact: {
        phone: '+91 98765 43210',
        email: 'support@caesifyNow.example',
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
        icon: 'Smartphone',
        formFields: ['brand', 'model'],
        filterFields: ['brand', 'model'],
        attrKeys: []
    },
    {
        id: 'screen-protectors',
        name: 'Screen Protectors',
        icon: 'Shield',
        formFields: ['brand', 'model', 'protectorType'],
        filterFields: ['brand', 'model', 'protectorType'],
        attrKeys: ['protectorType']
    },
    {
        id: 'chargers',
        name: 'Chargers',
        icon: 'Zap',
        formFields: ['connectorType', 'chargingSpeed'],
        filterFields: ['connectorType', 'chargingSpeed'],
        attrKeys: ['connectorType', 'chargingSpeed']
    },
    {
        id: 'earphones-earbuds',
        name: 'Earphones & Earbuds',
        icon: 'Headphones',
        formFields: ['earphoneType'],
        filterFields: ['earphoneType'],
        attrKeys: ['earphoneType']
    },
    {
        id: 'power-banks',
        name: 'Power Banks',
        icon: 'Battery',
        formFields: ['capacity'],
        filterFields: ['capacity'],
        attrKeys: ['capacity']
    },
    {
        id: 'cables',
        name: 'Cables',
        icon: 'Cable',
        formFields: ['cableType', 'cableConnector'],
        filterFields: ['cableType', 'cableConnector'],
        attrKeys: ['cableType', 'cableConnector']
    },
    {
        id: 'smart-watches',
        name: 'Smart Watches',
        icon: 'Watch',
        formFields: ['brand'],
        filterFields: ['brand'],
        attrKeys: []
    }
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export const getCategoryConfig = (name) => {
    return CATEGORIES.find((c) => c.name === name) || null;
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

export const FORM_FIELD_LABELS = {
    brand: 'Brand',
    model: 'Model Name',
    protectorType: 'Protector Type',
    connectorType: 'Connector Type',
    chargingSpeed: 'Charging Speed / Wattage',
    cableType: 'Cable Type',
    cableConnector: 'Connector Type',
    earphoneType: 'Type',
    capacity: 'Capacity'
};

export const FORM_FIELD_PLACEHOLDERS = {
    brand: 'Select brand',
    model: 'Select model',
    protectorType: 'Select protector type',
    connectorType: 'Select connector type',
    chargingSpeed: 'Select charging speed',
    cableType: 'Select cable type',
    cableConnector: 'Select connector type',
    earphoneType: 'Select type',
    capacity: 'Select capacity'
};
