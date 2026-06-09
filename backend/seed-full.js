require('dotenv').config();
const { sequelize, connectDB } = require('./src/config/db');
const Brand = require('./src/models/Brand');
const DeviceModel = require('./src/models/DeviceModel');
const CategoryBrand = require('./src/models/CategoryBrand');
const HeroSlide = require('./src/models/HeroSlide');
const Material = require('./src/models/Material');
const CategoryMaterial = require('./src/models/CategoryMaterial');

// ── Brands ──────────────────────────────────────────────
const BRANDS = [
    // Phone manufacturers
    { name: 'Apple', slug: 'apple', deviceTypes: ['phone', 'smartwatch', 'laptop', 'tablet', 'earbuds'] },
    { name: 'Samsung', slug: 'samsung', deviceTypes: ['phone', 'smartwatch', 'laptop', 'tablet', 'earbuds'] },
    { name: 'Google', slug: 'google', deviceTypes: ['phone', 'laptop', 'tablet', 'earbuds'] },
    { name: 'OnePlus', slug: 'oneplus', deviceTypes: ['phone', 'tablet', 'earbuds'] },
    { name: 'Xiaomi', slug: 'xiaomi', deviceTypes: ['phone', 'smartwatch', 'laptop', 'tablet', 'earbuds'] },
    { name: 'Nothing', slug: 'nothing', deviceTypes: ['phone', 'earbuds'] },
    { name: 'Motorola', slug: 'motorola', deviceTypes: ['phone'] },
    { name: 'Oppo', slug: 'oppo', deviceTypes: ['phone', 'earbuds'] },
    { name: 'Vivo', slug: 'vivo', deviceTypes: ['phone'] },
    { name: 'Realme', slug: 'realme', deviceTypes: ['phone', 'smartwatch', 'earbuds'] },
    { name: 'iQOO', slug: 'iqoo', deviceTypes: ['phone'] },
    { name: 'Asus', slug: 'asus', deviceTypes: ['phone', 'laptop'] },
    { name: 'Huawei', slug: 'huawei', deviceTypes: ['phone', 'laptop', 'tablet', 'smartwatch', 'earbuds'] },
    { name: 'Sony', slug: 'sony', deviceTypes: ['phone', 'smartwatch', 'earbuds', 'laptop'] },
    { name: 'LG', slug: 'lg', deviceTypes: ['phone', 'laptop', 'tablet'] },
    { name: 'Nokia', slug: 'nokia', deviceTypes: ['phone'] },
    { name: 'Tecno', slug: 'tecno', deviceTypes: ['phone'] },
    { name: 'Infinix', slug: 'infinix', deviceTypes: ['phone'] },
    { name: 'Micromax', slug: 'micromax', deviceTypes: ['phone'] },
    { name: 'Lava', slug: 'lava', deviceTypes: ['phone'] },
    // Audio & accessories
    { name: 'boAt', slug: 'boat', deviceTypes: ['earbuds', 'smartwatch'] },
    { name: 'JBL', slug: 'jbl', deviceTypes: ['earbuds'] },
    { name: 'Sennheiser', slug: 'sennheiser', deviceTypes: ['earbuds'] },
    { name: 'Noise', slug: 'noise', deviceTypes: ['earbuds', 'smartwatch'] },
    { name: 'Fire-Boltt', slug: 'fire-boltt', deviceTypes: ['earbuds', 'smartwatch'] },
    { name: 'Mivi', slug: 'mivi', deviceTypes: ['earbuds'] },
    { name: 'pTron', slug: 'ptron', deviceTypes: ['earbuds', 'smartwatch'] },
    { name: 'Boult Audio', slug: 'boult-audio', deviceTypes: ['earbuds', 'smartwatch'] },
    // Chargers, cables, power banks
    { name: 'Anker', slug: 'anker', deviceTypes: [] },
    { name: 'MI', slug: 'mi', deviceTypes: [] },
    { name: 'Belkin', slug: 'belkin', deviceTypes: [] },
    { name: 'Spigen', slug: 'spigen', deviceTypes: [] },
    { name: 'ESR', slug: 'esr', deviceTypes: [] },
    { name: 'UAG', slug: 'uag', deviceTypes: [] },
    { name: 'Ringke', slug: 'ringke', deviceTypes: [] },
    { name: 'SmartDevil', slug: 'smartdevil', deviceTypes: [] },
    { name: 'Portronics', slug: 'portronics', deviceTypes: [] },
    { name: 'Ambrane', slug: 'ambrane', deviceTypes: [] },
    { name: 'Urbn', slug: 'urbn', deviceTypes: [] },
    // Laptop brands
    { name: 'Dell', slug: 'dell', deviceTypes: ['laptop'] },
    { name: 'HP', slug: 'hp', deviceTypes: ['laptop'] },
    { name: 'Lenovo', slug: 'lenovo', deviceTypes: ['laptop', 'tablet'] },
    { name: 'Acer', slug: 'acer', deviceTypes: ['laptop'] },
    { name: 'Microsoft', slug: 'microsoft', deviceTypes: ['laptop', 'tablet'] },
];

// ── Device Models ───────────────────────────────────────
// Keyed by brand slug
const MODELS_BY_BRAND = {
    apple: {
        phone: [
            'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
            'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
            'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
            'iPhone 16e'
        ],
        smartwatch: [
            'Apple Watch Series 8', 'Apple Watch Series 9', 'Apple Watch Series 10',
            'Apple Watch Ultra', 'Apple Watch Ultra 2', 'Apple Watch SE (2nd gen)'
        ],
        laptop: [
            'MacBook Air M2', 'MacBook Air M3', 'MacBook Air M4',
            'MacBook Pro 14" M3', 'MacBook Pro 16" M3', 'MacBook Pro 14" M4', 'MacBook Pro 16" M4'
        ],
        tablet: [
            'iPad 10th Gen', 'iPad Air M2', 'iPad Air M3',
            'iPad Pro 11" M4', 'iPad Pro 13" M4', 'iPad mini 7th Gen'
        ],
        earbuds: [
            'AirPods Pro 2nd Gen', 'AirPods 3rd Gen', 'AirPods 4th Gen',
            'AirPods Max'
        ]
    },
    samsung: {
        phone: [
            'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra',
            'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE',
            'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S24 FE',
            'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra',
            'Galaxy Z Flip 4', 'Galaxy Z Flip 5', 'Galaxy Z Flip 6',
            'Galaxy Z Fold 4', 'Galaxy Z Fold 5', 'Galaxy Z Fold 6',
            'Galaxy A14', 'Galaxy A15', 'Galaxy A16',
            'Galaxy A25', 'Galaxy A35', 'Galaxy A55',
            'Galaxy M14', 'Galaxy M15', 'Galaxy M35',
            'Galaxy Note 20 Ultra'
        ],
        smartwatch: [
            'Galaxy Watch 5', 'Galaxy Watch 5 Pro',
            'Galaxy Watch 6', 'Galaxy Watch 6 Classic',
            'Galaxy Watch 7', 'Galaxy Watch 7 Ultra',
            'Galaxy Watch FE'
        ],
        laptop: [
            'Galaxy Book 3', 'Galaxy Book 3 Pro', 'Galaxy Book 3 Ultra',
            'Galaxy Book 4', 'Galaxy Book 4 Pro', 'Galaxy Book 4 Ultra'
        ],
        tablet: [
            'Galaxy Tab S8', 'Galaxy Tab S8+', 'Galaxy Tab S8 Ultra',
            'Galaxy Tab S9', 'Galaxy Tab S9+', 'Galaxy Tab S9 Ultra', 'Galaxy Tab S9 FE', 'Galaxy Tab S9 FE+',
            'Galaxy Tab S10', 'Galaxy Tab S10+', 'Galaxy Tab S10 Ultra'
        ],
        earbuds: [
            'Galaxy Buds 2 Pro', 'Galaxy Buds 3', 'Galaxy Buds 3 Pro', 'Galaxy Buds FE'
        ]
    },
    google: {
        phone: [
            'Pixel 7', 'Pixel 7 Pro', 'Pixel 7a',
            'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a',
            'Pixel 9', 'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Pixel 9a',
            'Pixel Fold', 'Pixel 9 Pro Fold'
        ],
        laptop: ['Pixelbook Go'],
        tablet: ['Pixel Tablet'],
        earbuds: ['Pixel Buds Pro', 'Pixel Buds A-Series', 'Pixel Buds Pro 2']
    },
    oneplus: {
        phone: [
            'OnePlus 11', 'OnePlus 11R',
            'OnePlus 12', 'OnePlus 12R',
            'OnePlus 13', 'OnePlus 13R',
            'OnePlus Open',
            'OnePlus Nord CE 3', 'OnePlus Nord CE 4',
            'OnePlus Nord 3', 'OnePlus Nord 4'
        ],
        tablet: ['OnePlus Pad', 'OnePlus Pad 2'],
        earbuds: ['OnePlus Buds Pro 2', 'OnePlus Buds 3', 'OnePlus Buds Z2']
    },
    xiaomi: {
        phone: [
            'Xiaomi 13', 'Xiaomi 13 Pro', 'Xiaomi 13 Ultra',
            'Xiaomi 14', 'Xiaomi 14 Pro', 'Xiaomi 14 Ultra', 'Xiaomi 14T', 'Xiaomi 14T Pro',
            'Xiaomi 15', 'Xiaomi 15 Pro', 'Xiaomi 15 Ultra',
            'Redmi Note 12 Pro', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14 Pro+',
            'Redmi 12', 'Redmi 13', 'Redmi 14',
            'POCO X5 Pro', 'POCO X6 Pro', 'POCO X7 Pro',
            'POCO F5', 'POCO F6', 'POCO F7',
            'POCO M6 Pro', 'POCO M7 Pro'
        ],
        smartwatch: ['Redmi Watch 3', 'Redmi Watch 4', 'Xiaomi Watch S3'],
        laptop: ['Mi Notebook Air', 'RedmiBook 15', 'Xiaomi Book Air 13'],
        tablet: ['Xiaomi Pad 5', 'Xiaomi Pad 6', 'Xiaomi Pad 7 Pro'],
        earbuds: ['Redmi Buds 4 Pro', 'Redmi Buds 5 Pro', 'Xiaomi Buds 4 Pro']
    },
    nothing: {
        phone: ['Phone (1)', 'Phone (2)', 'Phone (2a)', 'Phone (3)', 'Phone (3a)'],
        earbuds: ['Ear (1)', 'Ear (2)', 'Ear (3)', 'Ear (a)', 'Ear (open)']
    },
    motorola: {
        phone: [
            'Moto Edge 40', 'Moto Edge 40 Pro', 'Moto Edge 50', 'Moto Edge 50 Pro', 'Moto Edge 50 Fusion', 'Moto Edge 50 Neo',
            'Moto G54', 'Moto G55', 'Moto G65',
            'Moto G84', 'Moto G85',
            'Moto Razr 40', 'Moto Razr 40 Ultra', 'Moto Razr 50', 'Moto Razr 50 Ultra',
            'Moto ThinkPhone'
        ]
    },
    oppo: {
        phone: [
            'Oppo Find X5', 'Oppo Find X5 Pro', 'Oppo Find X6', 'Oppo Find X6 Pro', 'Oppo Find X7', 'Oppo Find X7 Pro', 'Oppo Find X8', 'Oppo Find X8 Pro',
            'Oppo Reno 10 Pro', 'Oppo Reno 11 Pro', 'Oppo Reno 12 Pro', 'Oppo Reno 13 Pro',
            'Oppo F23', 'Oppo F25', 'Oppo F27'
        ],
        earbuds: ['Oppo Enco Air 3 Pro', 'Oppo Enco X3']
    },
    vivo: {
        phone: [
            'Vivo X90 Pro', 'Vivo X100', 'Vivo X100 Pro', 'Vivo X200', 'Vivo X200 Pro',
            'Vivo V29', 'Vivo V29 Pro', 'Vivo V30', 'Vivo V30 Pro', 'Vivo V40', 'Vivo V40 Pro',
            'Vivo T3', 'Vivo T3 Pro', 'Vivo T4',
            'Vivo Y100', 'Vivo Y200', 'Vivo Y300'
        ]
    },
    realme: {
        phone: [
            'Realme GT 3', 'Realme GT 5', 'Realme GT 6', 'Realme GT 7 Pro',
            'Realme 11 Pro+', 'Realme 12 Pro+', 'Realme 13 Pro+',
            'Realme Narzo 60', 'Realme Narzo 70 Pro', 'Realme Narzo 80 Pro',
            'Realme C55', 'Realme C65', 'Realme C75'
        ],
        smartwatch: ['Realme Watch 3 Pro', 'Realme Watch S2'],
        earbuds: ['Realme Buds Air 5 Pro', 'Realme Buds T300']
    },
    iqoo: {
        phone: [
            'iQOO 11', 'iQOO 12', 'iQOO 13',
            'iQOO Neo 7 Pro', 'iQOO Neo 9 Pro', 'iQOO Neo 10 Pro',
            'iQOO Z7', 'iQOO Z8', 'iQOO Z9', 'iQOO Z9s Pro',
            'iQOO T3'
        ]
    },
    asus: {
        phone: ['Zenfone 10', 'Zenfone 11 Ultra', 'ROG Phone 7', 'ROG Phone 8', 'ROG Phone 9'],
        laptop: [
            'ZenBook 14', 'ZenBook 14X', 'ROG Zephyrus G14', 'ROG Zephyrus G16',
            'TUF Gaming A15', 'TUF Gaming F15', 'Vivobook 15', 'Vivobook S 14 OLED'
        ]
    },
    huawei: {
        phone: [
            'P60 Pro', 'Pura 70', 'Pura 70 Pro', 'Pura 70 Ultra',
            'Mate 60 Pro', 'Mate 70', 'Mate 70 Pro',
            'Nova 12', 'Nova 13', 'Nova 14'
        ],
        smartwatch: ['Watch GT 4', 'Watch Ultimate', 'Watch D2'],
        laptop: ['MateBook X Pro', 'MateBook 14', 'MateBook D16'],
        tablet: ['MatePad Pro 13.2', 'MatePad Air', 'MatePad SE 11'],
        earbuds: ['FreeBuds Pro 3', 'FreeBuds 5i', 'FreeClip']
    },
    sony: {
        phone: ['Xperia 1 V', 'Xperia 5 V'],
        smartwatch: [],
        earbuds: ['WF-1000XM5', 'WH-1000XM5', 'LinkBuds S', 'WH-CH720N'],
        laptop: ['VAIO SX14']
    },
    nokia: {
        phone: ['Nokia G22', 'Nokia G42', 'Nokia G310', 'Nokia X30', 'Nokia C32', 'Nokia C22']
    },
    // ── Audio brands ───────────────────────────────────
    boat: {
        earbuds: [
            'Airdopes 131', 'Airdopes 141', 'Airdopes 161', 'Airdopes 181',
            'Airdopes 200', 'Airdopes 300 Pro', 'Airdopes 500 Pro',
            'Airdopes Max', 'Airdopes Storm', 'Airdopes Genesis',
            'Rockerz 245 Pro', 'Rockerz 255 Pro+', 'Rockerz 333', 'Rockerz 450',
            'Rockerz 550', 'Rockerz 558', 'Rockerz 660', 'Rockerz 770'
        ],
        smartwatch: [
            'Ultima Pronto', 'Ultima Call Connect', 'Ultima One',
            'Wave Connect', 'Wave Call', 'Wave Stride', 'Wave Pro',
            'Storm Call', 'Storm Pro'
        ]
    },
    jbl: {
        earbuds: [
            'Tune 110BT', 'Tune 230NC TWS', 'Tune 520BT', 'Tune 720BT',
            'Tour One M2', 'Live 460NC', 'Live 520BT', 'Live 660NC',
            'Quantum 100', 'Quantum 350', 'Quantum 610',
            'Flip 5', 'Flip 6', 'Charge 4', 'Charge 5', 'JBL Clip 4', 'JBL Go 3'
        ]
    },
    sennheiser: {
        earbuds: ['Momentum 4 Wireless', 'Momentum True Wireless 3', 'Momentum True Wireless 4', 'Accentum', 'CX Plus', 'HD 560S', 'HD 600']
    },
    noise: {
        earbuds: [
            'Buds VS102', 'Buds VS104', 'Buds VS106', 'Buds VS108',
            'Air Buds Pro', 'Air Buds Max', 'Earbuds X-3',
            'Pulse Buds', 'Pulse Go'
        ],
        smartwatch: [
            'ColorFit Ultra 3', 'ColorFit Ultra 4', 'ColorFit Pro 5',
            'Vita 2', 'New Icon 2', 'Icon 3',
            'Evolve 2', 'Evolve 3'
        ]
    },
    'fire-boltt': {
        earbuds: ['Viper', 'Blaze', 'Blade', 'Dagger', 'Thunder Pro'],
        smartwatch: [
            'Ninja Call Pro', 'Ninja Calling Max', 'Invincible Plus',
            'Diamond 4G', 'Diamond Pro', 'Talk 2', 'Talk 3',
            'Artemis', 'Athena', 'Hercule'
        ]
    },
    mivi: {
        earbuds: ['DuoPods A350', 'DuoPods M40', 'DuoPods 600', 'DuoPods 800', 'DuoPods Pro']
    },
    ptron: {
        earbuds: ['Force X2', 'Force X3', 'MAXXi', 'MAXX TWS', 'Tangent TWS', 'Bassbuds'],
        smartwatch: ['Reflex', 'Reflex 2', 'Spark', 'Ritmo']
    },
    'boult-audio': {
        earbuds: ['Z10', 'Z20', 'Z40', 'Z60', 'AirBass Pro', 'Astra TWS', 'Curve', 'Q TWS'],
        smartwatch: ['Drift', 'Drift Pro', 'Xtreme', 'Neo', 'Vibe', 'Vibe Plus']
    },
    // ── Accessory brands (no device models) ────────────
    anker: { },
    mi: { },
    belkin: { },
    spigen: { },
    esr: { },
    uag: { },
    ringke: { },
    smartdevil: { },
    portronics: { },
    ambrane: { },
    urb: { },
    // ── Laptop-only brands ────────────────────────────
    dell: {
        laptop: [
            'XPS 13', 'XPS 14', 'XPS 15', 'XPS 16',
            'Inspiron 14', 'Inspiron 15', 'Inspiron 16',
            'Latitude 5440', 'Latitude 5550', 'Latitude 7450',
            'Alienware m16', 'Alienware x14', 'Alienware x16',
            'G15', 'G16'
        ]
    },
    hp: {
        laptop: [
            'Pavilion 14', 'Pavilion 15', 'Pavilion 16',
            'Spectre x360', 'Spectre x360 16',
            'EliteBook 840', 'EliteBook 860',
            'Envy x360', 'Envy 16',
            'Victus 15', 'Victus 16',
            'Omen 16', 'Omen 17', 'Omen Transcend 14'
        ]
    },
    lenovo: {
        laptop: [
            'ThinkPad X1 Carbon Gen 11', 'ThinkPad X1 Carbon Gen 12',
            'ThinkPad X13', 'ThinkPad T14', 'ThinkPad T14s', 'ThinkPad T16',
            'IdeaPad Slim 3', 'IdeaPad Slim 5', 'IdeaPad Pro 5',
            'Legion 5', 'Legion 5 Pro', 'Legion 7i', 'Legion 9i',
            'Yoga 7', 'Yoga 9i', 'Yoga Slim 7'
        ],
        tablet: ['Tab P11 Pro', 'Tab P12 Pro', 'Tab M10']
    },
    acer: {
        laptop: [
            'Aspire 5', 'Aspire 7', 'Aspire Vero',
            'Predator Helios 16', 'Predator Helios 18',
            'Swift 3', 'Swift 5', 'Swift Go 14',
            'Nitro 5', 'Nitro 16', 'Nitro V 15'
        ]
    },
    microsoft: {
        laptop: ['Surface Laptop 5', 'Surface Laptop 6', 'Surface Laptop Studio 2'],
        tablet: ['Surface Pro 9', 'Surface Pro 10', 'Surface Go 4']
    },
};

// ── Materials ─────────────────────────────────────────────
const MATERIALS = [
    'Silicone', 'TPU', 'Polycarbonate', 'Leather', 'Wood',
    'Carbon Fiber', 'Metal', 'Fabric', 'Transparent', 'Hybrid',
    'Rubber', 'Plastic', 'Aluminum', 'Stainless Steel', 'Glass',
    'Ceramic', 'Acrylic', 'Velvet', 'Denim', 'Canvas',
    'Suede', 'Liquid Silicone', 'Frosted', 'Clear', 'Matte',
    'Glossy', 'Bumper', 'Aramid Fiber', 'Kevlar', 'Thermoplastic'
];

// ── Category → Materials mapping ──────────────────────────
const CATEGORY_MATERIALS = {
    'Mobile Back Covers': [
        'Silicone', 'TPU', 'Polycarbonate', 'Leather', 'Wood',
        'Carbon Fiber', 'Metal', 'Fabric', 'Transparent', 'Hybrid',
        'Rubber', 'Liquid Silicone', 'Frosted', 'Clear', 'Matte',
        'Glossy', 'Bumper', 'Aramid Fiber', 'Kevlar', 'Thermoplastic'
    ],
    'Screen Protectors': [
        'Glass', 'TPU', 'Plastic', 'Matte', 'Clear', 'Ceramic',
        'Privacy', 'Anti-Glare', 'Frosted'
    ],
    'Chargers': [
        'Plastic', 'Aluminum', 'Polycarbonate', 'Rubber', 'Metal',
        'Carbon Fiber', 'Silicone', 'Fabric'
    ],
    'Earphones & Earbuds': [
        'Plastic', 'Silicone', 'Metal', 'Aluminum', 'Leather',
        'Fabric', 'Rubber', 'Memory Foam'
    ],
    'Power Banks': [
        'Plastic', 'Aluminum', 'Polycarbonate', 'Rubber', 'Metal',
        'Silicone', 'Leather'
    ],
    'Cables': [
        'Rubber', 'Fabric', 'TPU', 'Plastic', 'Aluminum',
        'Nylon Braided', 'Silicone', 'Kevlar'
    ],
    'Smart Watches': [
        'Silicone', 'Leather', 'Metal', 'Stainless Steel', 'Fabric',
        'Plastic', 'Rubber', 'Ceramic', 'Wood', 'Nylon'
    ],
    'Laptop Accessories': [
        'Plastic', 'Aluminum', 'Polycarbonate', 'Fabric', 'Leather',
        'Rubber', 'Metal', 'Carbon Fiber', 'Canvas', 'Neoprene'
    ]
};

// ── Category → Brand mapping ────────────────────────────
const CATEGORY_BRANDS = {
    'Mobile Back Covers': [
        'apple', 'samsung', 'google', 'oneplus', 'xiaomi', 'nothing',
        'motorola', 'oppo', 'vivo', 'realme', 'iqoo', 'asus',
        'huawei', 'sony', 'nokia', 'tecno', 'infinix', 'micronix', 'lava',
        'spigen', 'ringke', 'smartdevil', 'esr', 'uag', 'urb'
    ],
    'Screen Protectors': [
        'apple', 'samsung', 'google', 'oneplus', 'xiaomi', 'nothing',
        'motorola', 'oppo', 'vivo', 'realme', 'iqoo', 'asus',
        'huawei', 'sony', 'nokia', 'tecno', 'infinix', 'micronix', 'lava',
        'spigen', 'esr', 'belkin', 'ambrane', 'smartdevil', 'ringke'
    ],
    'Chargers': [
        'apple', 'samsung', 'google', 'oneplus', 'xiaomi',
        'anker', 'mi', 'belkin', 'spigen', 'portronics', 'ambrane',
        'esr', 'sony', 'lg', 'realme', 'oppo', 'vivo'
    ],
    'Earphones & Earbuds': [
        'boat', 'jbl', 'sennheiser', 'sony', 'noise', 'fire-boltt',
        'mivi', 'ptron', 'boult-audio', 'anker', 'mi', 'apple',
        'samsung', 'google', 'oneplus', 'xiaomi', 'huawei', 'realme',
        'oppo', 'nothing', 'portronics', 'ambrane'
    ],
    'Power Banks': [
        'anker', 'mi', 'belkin', 'samsung', 'ambrane', 'portronics',
        'urb', 'realme', 'oneplus', 'spigen', 'xiaomi', 'esr', 'sony'
    ],
    'Cables': [
        'anker', 'belkin', 'mi', 'spigen', 'portronics', 'ambrane',
        'urb', 'esr', 'samsung', 'oneplus', 'realme', 'xiaomi',
        'apple', 'sony', 'smartdevil'
    ],
    'Smart Watches': [
        'apple', 'samsung', 'boat', 'noise', 'fire-boltt',
        'realme', 'xiaomi', 'ptron', 'boult-audio',
        'huawei', 'sony',
        'spigen', 'esr', 'ringke', 'belkin', 'uag'
    ],
    'Laptop Accessories': [
        'dell', 'hp', 'lenovo', 'acer', 'asus', 'apple', 'samsung',
        'microsoft', 'xiaomi', 'huawei',
        'anker', 'belkin', 'portronics', 'mi', 'spigen', 'ambrane', 'urb'
    ],
};

async function seed() {
    try {
        await connectDB();

        // ── Brands ──────────────────────────────────────
        const existingBrands = await Brand.count();
        let brandRows = [];
        if (existingBrands > 0) {
            console.log(`${existingBrands} brands exist, skipping brand seed.`);
            brandRows = await Brand.findAll();
        } else {
            brandRows = await Brand.bulkCreate(
                BRANDS.map((b) => ({ name: b.name, slug: b.slug, isActive: true })),
                { returning: true }
            );
            console.log(`Seeded ${brandRows.length} brands`);
        }

        const brandMap = {};
        brandRows.forEach((b) => { brandMap[b.slug] = b; });

        // ── Device Models ───────────────────────────────
        const existingModels = await DeviceModel.count();
        if (existingModels > 0) {
            console.log(`${existingModels} models exist, skipping model seed.`);
        } else {
            const modelRows = [];
            for (const [slug, devices] of Object.entries(MODELS_BY_BRAND)) {
                const brand = brandMap[slug];
                if (!brand) continue;
                for (const [deviceType, names] of Object.entries(devices)) {
                    if (!Array.isArray(names)) continue;
                    for (const name of names) {
                        const modelSlug = `${slug}-${name.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
                        modelRows.push({
                            name,
                            slug: modelSlug,
                            BrandId: brand.id,
                            deviceType: deviceType === 'earbuds' ? 'earbuds' : deviceType,
                            isActive: true
                        });
                    }
                }
            }
            // Batch insert in chunks
            const chunkSize = 50;
            for (let i = 0; i < modelRows.length; i += chunkSize) {
                await DeviceModel.bulkCreate(modelRows.slice(i, i + chunkSize));
            }
            console.log(`Seeded ${modelRows.length} device models`);
        }

        // ── Category-Brand Links ────────────────────────
        const existingLinks = await CategoryBrand.count();
        if (existingLinks > 0) {
            console.log(`${existingLinks} category-brand links exist, skipping.`);
        } else {
            const links = [];
            for (const [cat, brandSlugs] of Object.entries(CATEGORY_BRANDS)) {
                for (const slug of brandSlugs) {
                    const brand = brandMap[slug];
                    if (brand) {
                        links.push({ categoryName: cat, BrandId: brand.id });
                    }
                }
            }
            await CategoryBrand.bulkCreate(links);
            console.log(`Seeded ${links.length} category-brand links`);
        }

        // ── Materials ────────────────────────────────────
        const existingMaterials = await Material.count();
        let materialRows = [];
        if (existingMaterials > 0) {
            console.log(`${existingMaterials} materials exist, skipping.`);
            materialRows = await Material.findAll();
        } else {
            materialRows = await Material.bulkCreate(
                MATERIALS.map((name) => ({
                    name,
                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    isActive: true
                })),
                { returning: true }
            );
            console.log(`Seeded ${materialRows.length} materials`);
        }

        const materialMap = {};
        materialRows.forEach((m) => { materialMap[m.name] = m; });

        // ── Category-Material Links ──────────────────────
        const existingCatMat = await CategoryMaterial.count();
        if (existingCatMat > 0) {
            console.log(`${existingCatMat} category-material links exist, skipping.`);
        } else {
            const links = [];
            for (const [cat, names] of Object.entries(CATEGORY_MATERIALS)) {
                for (const name of names) {
                    const mat = materialMap[name];
                    if (mat) {
                        links.push({ categoryName: cat, MaterialId: mat.id });
                    }
                }
            }
            await CategoryMaterial.bulkCreate(links);
            console.log(`Seeded ${links.length} category-material links`);
        }

        // ── Hero Slides ─────────────────────────────────
        const existingSlides = await HeroSlide.count();
        if (existingSlides === 0) {
            await HeroSlide.bulkCreate([
                { title: 'Protect Your Device', subtitle: 'Premium mobile accessories with latest designs.', ctaText: 'Shop Now', ctaLink: '/shop', bg: 'https://images.unsplash.com/photo-1705346738010-d480180032ba?auto=format&fit=crop&w=1200&q=65', sortOrder: 0, isActive: true },
                { title: 'Design It Yourself', subtitle: 'AI-powered studio to make a case as unique as you.', ctaText: 'Open Studio', ctaLink: '/customize', bg: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=65', sortOrder: 1, isActive: true },
                { title: 'Summer Sale Now Live', subtitle: 'Up to 50% off on selected premium accessories.', ctaText: 'Shop Deals', ctaLink: '/shop?sort=price_desc', bg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=65', sortOrder: 2, isActive: true }
            ]);
            console.log('Seeded 3 hero slides');
        } else {
            console.log(`${existingSlides} hero slides exist, skipping.`);
        }

        console.log('\n✓ Seed complete!');
        await sequelize.close();
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seed();
