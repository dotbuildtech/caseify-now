require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/db');
const Material = require('../src/models/Material');

const DEFAULT_MATERIALS = [
    { name: 'Matte Hard Case', slug: 'matte-hard', price: 399, isDefault: true, description: 'Slim matte finish, lightweight, scratch-resistant' },
    { name: 'Glossy Hard Case', slug: 'glossy-hard', price: 349, description: 'High-gloss finish, vibrant color reproduction' },
    { name: 'Soft Silicone', slug: 'soft-silicone', price: 449, description: 'Flexible grip, shock absorbent, comfortable' },
    { name: 'Clear TPU', slug: 'clear-tpu', price: 299, description: 'Crystal clear, anti-yellow, ultra slim' },
    { name: 'Premium Leather', slug: 'leather-premium', price: 899, description: 'Genuine Italian leather, luxury handcrafted' },
    { name: 'Carbon Fiber', slug: 'carbon-fiber', price: 799, description: 'Real carbon fiber weave, aerospace grade' },
    { name: 'Wood Veneer', slug: 'wood-veneer', price: 699, description: 'Real wood grain, hand-finished' },
    { name: 'Brushed Metal', slug: 'metal-brushed', price: 649, description: 'Aluminium brushed, cool-touch finish' },
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        const count = await Material.count();
        if (count > 0) {
            const missingPrice = await Material.count({ where: { price: null } });
            if (missingPrice > 0) {
                console.log(`Backfilling ${missingPrice} material(s) with default price...`);
                for (const m of DEFAULT_MATERIALS) {
                    const existing = await Material.findOne({ where: { slug: m.slug } });
                    if (existing && existing.price == null) {
                        await existing.update({ price: m.price, isDefault: m.isDefault || false });
                        console.log(`Updated: ${m.name} (₹${m.price}) ${m.isDefault ? '★ DEFAULT' : ''}`);
                    }
                }
                const defaultExists = await Material.findOne({ where: { isDefault: true } });
                if (!defaultExists) {
                    const first = await Material.findOne({ order: [['id', 'ASC']] });
                    if (first) { await first.update({ isDefault: true }); console.log(`Set "${first.name}" as default`); }
                }
            } else {
                console.log(`Found ${count} existing materials with prices, skipping seed.`);
            }
            process.exit(0);
        }

        for (const m of DEFAULT_MATERIALS) {
            await Material.create(m);
            console.log(`Created: ${m.name} (₹${m.price})`);
        }

        console.log('Seed complete');
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
