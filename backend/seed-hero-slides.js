const { sequelize, connectDB } = require('./src/config/db');
const HeroSlide = require('./src/models/HeroSlide');

const SLIDES = [
    {
        title: 'Protect Your Device',
        subtitle: 'Premium mobile accessories with latest designs.',
        ctaText: 'Shop Now',
        ctaLink: '/shop',
        bg: 'https://images.unsplash.com/photo-1705346738010-d480180032ba?auto=format&fit=crop&w=1200&q=65',
        sortOrder: 0,
        isActive: true
    },
    {
        title: 'Design It Yourself',
        subtitle: 'AI-powered studio to make a case as unique as you.',
        ctaText: 'Open Studio',
        ctaLink: '/customize',
        bg: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=65',
        sortOrder: 1,
        isActive: true
    },
    {
        title: 'Summer Sale Now Live',
        subtitle: 'Up to 50% off on selected premium accessories.',
        ctaText: 'Shop Deals',
        ctaLink: '/shop?sort=price_desc',
        bg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=65',
        sortOrder: 2,
        isActive: true
    }
];

async function seed() {
    try {
        await connectDB();
        const existing = await HeroSlide.count();
        if (existing > 0) {
            console.log(`${existing} hero slides already exist, skipping seed.`);
        } else {
            await HeroSlide.bulkCreate(SLIDES);
            console.log(`Seeded ${SLIDES.length} hero slides`);
        }
        await sequelize.close();
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seed();
