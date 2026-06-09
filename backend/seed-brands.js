const { sequelize, connectDB } = require('./src/config/db');
const Brand = require('./src/models/Brand');
const DeviceModel = require('./src/models/DeviceModel');

const BRANDS = [
    { name: 'Apple', slug: 'apple', description: 'iPhone, iPad, Mac, Apple Watch' },
    { name: 'Samsung', slug: 'samsung', description: 'Galaxy phones, tablets, watches' },
    { name: 'Google', slug: 'google', description: 'Pixel phones, tablets' },
    { name: 'OnePlus', slug: 'oneplus', description: 'OnePlus phones and accessories' },
    { name: 'Xiaomi', slug: 'xiaomi', description: 'Xiaomi, Redmi, POCO phones' },
    { name: 'Nothing', slug: 'nothing', description: 'Nothing Phone' },
    { name: 'Motorola', slug: 'motorola', description: 'Motorola phones' },
    { name: 'Oppo', slug: 'oppo', description: 'Oppo phones' },
    { name: 'Vivo', slug: 'vivo', description: 'Vivo phones' },
    { name: 'Realme', slug: 'realme', description: 'Realme phones' },
    { name: 'boAt', slug: 'boat', description: 'boAt audio and accessories' },
    { name: 'JBL', slug: 'jbl', description: 'JBL audio' },
    { name: 'Sennheiser', slug: 'sennheiser', description: 'Sennheiser audio' },
    { name: 'Sony', slug: 'sony', description: 'Sony audio and accessories' },
    { name: 'Noise', slug: 'noise', description: 'Noise smartwatches and audio' },
    { name: 'Fire-Boltt', slug: 'fire-boltt', description: 'Fire-Boltt smartwatches and audio' },
    { name: 'Anker', slug: 'anker', description: 'Anker chargers, cables, power banks' },
    { name: 'MI', slug: 'mi', description: 'Xiaomi branded accessories' },
    { name: 'Belkin', slug: 'belkin', description: 'Belkin accessories' },
    { name: 'Spigen', slug: 'spigen', description: 'Spigen phone cases' },
    { name: 'OnePlus (Accessories)', slug: 'oneplus-accessories', description: 'OnePlus accessories' }
];

const MODELS = {
    apple: {
        phone: [
            'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
            'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
            'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
            'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
            'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
            'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
            'iPhone SE (2020)', 'iPhone SE (2022)'
        ],
        smartwatch: [
            'Apple Watch Series 7', 'Apple Watch Series 8', 'Apple Watch Series 9',
            'Apple Watch Series 10', 'Apple Watch Ultra', 'Apple Watch Ultra 2',
            'Apple Watch SE (2022)', 'Apple Watch SE (2023)'
        ],
        laptop: [
            'MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3',
            'MacBook Pro 14" M1', 'MacBook Pro 16" M1',
            'MacBook Pro 14" M2', 'MacBook Pro 16" M2',
            'MacBook Pro 14" M3', 'MacBook Pro 16" M3',
            'MacBook Pro 14" M4', 'MacBook Pro 16" M4'
        ]
    },
    samsung: {
        phone: [
            'Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra',
            'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra',
            'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra',
            'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra',
            'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra',
            'Galaxy Z Fold 3', 'Galaxy Z Fold 4', 'Galaxy Z Fold 5', 'Galaxy Z Fold 6',
            'Galaxy Z Flip 3', 'Galaxy Z Flip 4', 'Galaxy Z Flip 5', 'Galaxy Z Flip 6',
            'Galaxy A15', 'Galaxy A25', 'Galaxy A35', 'Galaxy A55',
            'Galaxy Note 20', 'Galaxy Note 20 Ultra'
        ],
        smartwatch: [
            'Galaxy Watch 4', 'Galaxy Watch 4 Classic',
            'Galaxy Watch 5', 'Galaxy Watch 5 Pro',
            'Galaxy Watch 6', 'Galaxy Watch 6 Classic',
            'Galaxy Watch 7', 'Galaxy Watch Ultra'
        ],
        laptop: [
            'Galaxy Book 3', 'Galaxy Book 3 Pro', 'Galaxy Book 3 Ultra',
            'Galaxy Book 4', 'Galaxy Book 4 Pro', 'Galaxy Book 4 Ultra'
        ]
    },
    google: {
        phone: [
            'Pixel 6', 'Pixel 6 Pro', 'Pixel 6a',
            'Pixel 7', 'Pixel 7 Pro', 'Pixel 7a',
            'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a',
            'Pixel 9', 'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Pixel 9a'
        ]
    },
    oneplus: {
        phone: [
            'OnePlus 10 Pro', 'OnePlus 10R', 'OnePlus 10T',
            'OnePlus 11', 'OnePlus 11R',
            'OnePlus 12', 'OnePlus 12R', 'OnePlus 12R (Genshin)',
            'OnePlus 13', 'OnePlus 13R',
            'OnePlus Nord 2', 'OnePlus Nord 2T', 'OnePlus Nord 3',
            'OnePlus Nord CE 3', 'OnePlus Nord CE 4',
            'OnePlus Open'
        ]
    },
    xiaomi: {
        phone: [
            'Xiaomi 13 Pro', 'Xiaomi 13T', 'Xiaomi 13T Pro',
            'Xiaomi 14', 'Xiaomi 14 Pro', 'Xiaomi 14 Ultra',
            'Redmi Note 11', 'Redmi Note 11 Pro', 'Redmi Note 12',
            'Redmi Note 12 Pro', 'Redmi Note 13', 'Redmi Note 13 Pro',
            'Redmi Note 14', 'Redmi Note 14 Pro',
            'POCO X5 Pro', 'POCO X6', 'POCO X6 Pro', 'POCO F5', 'POCO F6'
        ]
    },
    nothing: {
        phone: [
            'Phone (1)', 'Phone (2)', 'Phone (2a)', 'Phone (3a)'
        ]
    },
    motorola: {
        phone: [
            'Moto G73', 'Moto G84', 'Moto G85',
            'Moto Edge 40', 'Moto Edge 40 Pro',
            'Moto Edge 50', 'Moto Edge 50 Pro', 'Moto Edge 50 Ultra',
            'Moto Razr 40', 'Moto Razr 40 Ultra',
            'Moto Razr 50', 'Moto Razr 50 Ultra'
        ]
    },
    oppo: {
        phone: [
            'Oppo Find N3', 'Oppo Find N3 Flip',
            'Oppo Reno 10 Pro', 'Oppo Reno 11 Pro',
            'Oppo Reno 12 Pro', 'Oppo F25 Pro'
        ]
    },
    vivo: {
        phone: [
            'Vivo X80 Pro', 'Vivo X90 Pro', 'Vivo X100 Pro',
            'Vivo V30 Pro', 'Vivo V40 Pro',
            'Vivo T3 Pro'
        ]
    },
    realme: {
        phone: [
            'Realme GT 2 Pro', 'Realme GT 3', 'Realme GT 6',
            'Realme 11 Pro', 'Realme 12 Pro', 'Realme 12 Pro+',
            'Realme Narzo 70 Pro'
        ]
    }
};

async function seed() {
    try {
        await connectDB();
        const brandRecords = {};
        for (const bd of BRANDS) {
            const [brand] = await Brand.findOrCreate({
                where: { name: bd.name },
                defaults: bd
            });
            brandRecords[brand.slug] = brand;
        }
        console.log(`Seeded ${Object.keys(brandRecords).length} brands`);

        let count = 0;
        for (const [slug, deviceTypes] of Object.entries(MODELS)) {
            const brand = brandRecords[slug];
            if (!brand) continue;
            for (const [deviceType, names] of Object.entries(deviceTypes)) {
                for (const name of names) {
                    const modelSlug = `${slug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
                    try {
                        await DeviceModel.findOrCreate({
                            where: { slug: modelSlug },
                            defaults: { name, slug: modelSlug, BrandId: brand.id, deviceType }
                        });
                        count++;
                    } catch (err) {
                        console.error(`  Skipping ${name}: ${err.message}`);
                    }
                }
            }
        }
        console.log(`Seeded ${count} device models`);
        await sequelize.close();
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seed();
