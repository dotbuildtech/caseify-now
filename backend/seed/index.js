require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize, connectDB } = require('../src/config/db');
const Brand = require('../src/models/Brand');
const Material = require('../src/models/Material');
const Category = require('../src/models/Category');
const CategoryBrand = require('../src/models/CategoryBrand');
const CategoryMaterial = require('../src/models/CategoryMaterial');
const DeviceModel = require('../src/models/DeviceModel');
const HeroSlide = require('../src/models/HeroSlide');

const CATEGORIES = require('./data/categories');
const BRANDS = require('./data/brands');
const MATERIALS = require('./data/materials');
const CATEGORY_BRANDS = require('./data/categoryBrands');
const CATEGORY_MATERIALS = require('./data/categoryMaterials');
const MODELS_BY_BRAND = require('./data/deviceModels');
const HERO_SLIDES = require('./data/heroSlides');

async function seed() {
    try {
        await connectDB();

        // ── Categories ─────────────────────────────────
        const catRows = await seedCategories();
        const catMap = {};
        catRows.forEach((c) => { catMap[c.name] = c; });

        // ── Brands ─────────────────────────────────────
        const brandRows = await seedBrands();
        const brandMap = {};
        brandRows.forEach((b) => { brandMap[b.slug] = b; });

        // ── Device Models ──────────────────────────────
        await seedDeviceModels(brandMap);

        // ── Category-Brand Links ───────────────────────
        await seedCategoryBrands(catMap, brandMap);

        // ── Materials ──────────────────────────────────
        const materialRows = await seedMaterials();
        const materialMap = {};
        materialRows.forEach((m) => { materialMap[m.name] = m; });

        // ── Category-Material Links ────────────────────
        await seedCategoryMaterials(catMap, materialMap);

        // ── Hero Slides ────────────────────────────────
        await seedHeroSlides();

        console.log('\n✓ Seed complete!');
        await sequelize.close();
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

async function seedCategories() {
    const existing = await Category.count();
    if (existing > 0) {
        console.log(`${existing} categories exist, skipping.`);
        return Category.findAll();
    }
    const rows = await Category.bulkCreate(CATEGORIES, { returning: true });
    console.log(`Seeded ${rows.length} categories`);
    return rows;
}

async function seedBrands() {
    const existing = await Brand.count();
    if (existing > 0) {
        console.log(`${existing} brands exist, skipping.`);
        return Brand.findAll();
    }
    const rows = await Brand.bulkCreate(BRANDS, { returning: true });
    console.log(`Seeded ${rows.length} brands`);
    return rows;
}

async function seedDeviceModels(brandMap) {
    const existing = await DeviceModel.count();
    if (existing > 0) {
        console.log(`${existing} device models exist, skipping.`);
        return;
    }
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
                    deviceType,
                    isActive: true
                });
            }
        }
    }
    const chunkSize = 50;
    for (let i = 0; i < modelRows.length; i += chunkSize) {
        await DeviceModel.bulkCreate(modelRows.slice(i, i + chunkSize));
    }
    console.log(`Seeded ${modelRows.length} device models`);
}

async function seedCategoryBrands(catMap, brandMap) {
    const existing = await CategoryBrand.count();
    if (existing > 0) {
        console.log(`${existing} category-brand links exist, skipping.`);
        return;
    }
    const links = [];
    for (const [catName, brandSlugs] of Object.entries(CATEGORY_BRANDS)) {
        const category = catMap[catName];
        if (!category) {
            console.warn(`  Category "${catName}" not found, skipping its brand links.`);
            continue;
        }
        for (const slug of brandSlugs) {
            const brand = brandMap[slug];
            if (brand) {
                links.push({ categoryName: catName, BrandId: brand.id });
            } else {
                console.warn(`  Brand "${slug}" not found for category "${catName}"`);
            }
        }
    }
    await CategoryBrand.bulkCreate(links);
    console.log(`Seeded ${links.length} category-brand links`);
}

async function seedMaterials() {
    const existing = await Material.count();
    if (existing > 0) {
        console.log(`${existing} materials exist, skipping.`);
        return Material.findAll();
    }
    const rows = await Material.bulkCreate(MATERIALS, { returning: true });
    console.log(`Seeded ${rows.length} materials`);
    return rows;
}

async function seedCategoryMaterials(catMap, materialMap) {
    const existing = await CategoryMaterial.count();
    if (existing > 0) {
        console.log(`${existing} category-material links exist, skipping.`);
        return;
    }
    const links = [];
    for (const [catName, names] of Object.entries(CATEGORY_MATERIALS)) {
        const category = catMap[catName];
        if (!category) {
            console.warn(`  Category "${catName}" not found, skipping its material links.`);
            continue;
        }
        for (const name of names) {
            const mat = materialMap[name];
            if (mat) {
                links.push({ categoryName: catName, MaterialId: mat.id });
            } else {
                console.warn(`  Material "${name}" not found for category "${catName}"`);
            }
        }
    }
    await CategoryMaterial.bulkCreate(links);
    console.log(`Seeded ${links.length} category-material links`);
}

async function seedHeroSlides() {
    const existing = await HeroSlide.count();
    if (existing > 0) {
        console.log(`${existing} hero slides exist, skipping.`);
        return;
    }
    if (HERO_SLIDES.length > 0) {
        await HeroSlide.bulkCreate(HERO_SLIDES);
        console.log(`Seeded ${HERO_SLIDES.length} hero slides`);
    }
}

seed();
