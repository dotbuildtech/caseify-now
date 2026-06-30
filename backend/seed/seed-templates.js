require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/db');
const { DataTypes } = require('sequelize');

// Physical case dimensions (width × height in mm) for popular phone series
// Camera and safe-zone values are calculated from percentage-based seed-studio data
const TEMPLATES = [
    // ── Apple ──
    // ── Apple ──
    // Safe zone = 3% of case dimensions (matching original seed-studio)
    // sa.t / sa.b = ch * 0.03  → e.g., 168mm × 0.03 ≈ 5mm
    // sa.l / sa.r = cw * 0.03  → e.g., 81mm × 0.03 ≈ 2.5mm
    { name: 'iPhone 16 Pro Max',   modelSlug: 'apple-iphone-16-pro-max',   cw: 81, ch: 168, cr: 14,  cx: 26, cy: 15, cw2: 29, ch2: 9,  sa: { t: 5, b: 5, l: 2.5, r: 2.5 }, bp: 449 },
    { name: 'iPhone 16 Pro',        modelSlug: 'apple-iphone-16-pro',        cw: 76, ch: 154, cr: 13,  cx: 24, cy: 14, cw2: 27, ch2: 8.5,sa: { t: 4.6, b: 4.6, l: 2.3, r: 2.3 }, bp: 429 },
    { name: 'iPhone 16 Plus',      modelSlug: 'apple-iphone-16-plus',       cw: 81, ch: 166, cr: 14,  cx: 22, cy: 15, cw2: 37, ch2: 10, sa: { t: 5, b: 5, l: 2.5, r: 2.5 }, bp: 439 },
    { name: 'iPhone 16',           modelSlug: 'apple-iphone-16',            cw: 76, ch: 152, cr: 13,  cx: 20, cy: 14, cw2: 35, ch2: 9,  sa: { t: 4.6, b: 4.6, l: 2.3, r: 2.3 }, bp: 419 },
    { name: 'iPhone 15 Pro Max',   modelSlug: 'apple-iphone-15-pro-max',    cw: 81, ch: 166, cr: 14,  cx: 26, cy: 15, cw2: 29, ch2: 9,  sa: { t: 5, b: 5, l: 2.5, r: 2.5 }, bp: 439 },
    { name: 'iPhone 15 Pro',        modelSlug: 'apple-iphone-15-pro',        cw: 75, ch: 151, cr: 13,  cx: 24, cy: 14, cw2: 27, ch2: 8.5,sa: { t: 4.5, b: 4.5, l: 2.3, r: 2.3 }, bp: 419 },
    { name: 'iPhone 14 Pro Max',   modelSlug: 'apple-iphone-14-pro-max',    cw: 81, ch: 166, cr: 14,  cx: 26, cy: 15, cw2: 29, ch2: 9,  sa: { t: 5, b: 5, l: 2.5, r: 2.5 }, bp: 429 },
    { name: 'iPhone 14',           modelSlug: 'apple-iphone-14',            cw: 76, ch: 151, cr: 13,  cx: 20, cy: 14, cw2: 35, ch2: 9,  sa: { t: 4.5, b: 4.5, l: 2.3, r: 2.3 }, bp: 399 },

    // ── Samsung ──
    { name: 'Galaxy S25 Ultra',    modelSlug: 'galaxy-s25-ultra',   cw: 81, ch: 166, cr: 10, cx: 38, cy: 15, cw2: 4.5, ch2: 9,  sa: { t: 5, b: 5, l: 2.5, r: 2.5 }, bp: 449 },
    { name: 'Galaxy S25+',         modelSlug: 'galaxy-s25-plus',    cw: 78, ch: 162, cr: 9,  cx: 37, cy: 15, cw2: 4.3, ch2: 8.5,sa: { t: 4.9, b: 4.9, l: 2.3, r: 2.3 }, bp: 429 },
    { name: 'Galaxy S25',          modelSlug: 'galaxy-s25',         cw: 74, ch: 152, cr: 9,  cx: 35, cy: 14, cw2: 4,  ch2: 8,  sa: { t: 4.6, b: 4.6, l: 2.2, r: 2.2 }, bp: 399 },
    { name: 'Galaxy S24 Ultra',    modelSlug: 'galaxy-s24-ultra',   cw: 81, ch: 166, cr: 10, cx: 38, cy: 15, cw2: 4.5, ch2: 9,  sa: { t: 5, b: 5, l: 2.5, r: 2.5 }, bp: 439 },
    { name: 'Galaxy Z Fold 6',     modelSlug: 'galaxy-z-fold-6',    cw: 75, ch: 166, cr: 8,  cx: 35, cy: 15, cw2: 4,  ch2: 9,  sa: { t: 5, b: 5, l: 2.3, r: 2.3 }, bp: 499 },
    { name: 'Galaxy Z Flip 6',     modelSlug: 'galaxy-z-flip-6',    cw: 75, ch: 170, cr: 12, cx: 35, cy: 15, cw2: 4,  ch2: 9,  sa: { t: 5.1, b: 5.1, l: 2.3, r: 2.3 }, bp: 449 },

    // ── Google ──
    { name: 'Pixel 9 Pro XL',      modelSlug: 'pixel-9-pro-xl',  cw: 76, ch: 163, cr: 10, cx: 36, cy: 13, cw2: 3,  ch2: 6.5,sa: { t: 4.9, b: 4.9, l: 2.3, r: 2.3 }, bp: 429 },
    { name: 'Pixel 9 Pro',         modelSlug: 'pixel-9-pro',     cw: 71, ch: 154, cr: 10, cx: 34, cy: 12, cw2: 3,  ch2: 6,  sa: { t: 4.6, b: 4.6, l: 2.1, r: 2.1 }, bp: 419 },
    { name: 'Pixel 9',             modelSlug: 'pixel-9',         cw: 73, ch: 155, cr: 10, cx: 35, cy: 12, cw2: 3,  ch2: 6,  sa: { t: 4.7, b: 4.7, l: 2.2, r: 2.2 }, bp: 399 },
    { name: 'Pixel 8 Pro',         modelSlug: 'pixel-8-pro',     cw: 76, ch: 163, cr: 10, cx: 36, cy: 13, cw2: 3,  ch2: 6.5,sa: { t: 4.9, b: 4.9, l: 2.3, r: 2.3 }, bp: 419 },

    // ── OnePlus ──
    { name: 'OnePlus 13',          modelSlug: 'oneplus-13',     cw: 76, ch: 163, cr: 9,  cx: 36, cy: 15, cw2: 4,  ch2: 9,  sa: { t: 4.9, b: 4.9, l: 2.3, r: 2.3 }, bp: 429 },
    { name: 'OnePlus 13R',         modelSlug: 'oneplus-13r',    cw: 76, ch: 162, cr: 9,  cx: 36, cy: 15, cw2: 4,  ch2: 9,  sa: { t: 4.9, b: 4.9, l: 2.3, r: 2.3 }, bp: 399 },
    { name: 'OnePlus 12',          modelSlug: 'oneplus-12',     cw: 76, ch: 164, cr: 9,  cx: 36, cy: 15, cw2: 4,  ch2: 9,  sa: { t: 4.9, b: 4.9, l: 2.3, r: 2.3 }, bp: 419 },
    { name: 'OnePlus Open',        modelSlug: 'oneplus-open',   cw: 75, ch: 166, cr: 8,  cx: 35, cy: 15, cw2: 4,  ch2: 9,  sa: { t: 5, b: 5, l: 2.3, r: 2.3 }, bp: 499 },
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('DeviceTemplates').catch(() => null);
        if (!tableInfo) {
            console.log('DeviceTemplates table does not exist. Run migration first.');
            process.exit(1);
        }

        let created = 0, skipped = 0, notFound = 0;

        for (const tpl of TEMPLATES) {
            // Find the model by matching slug or name
            const [model] = await sequelize.query(
                `SELECT id, name, slug FROM "DeviceModels" WHERE slug LIKE :slug OR name ILIKE :name LIMIT 1`,
                { replacements: { slug: `%${tpl.modelSlug}%`, name: tpl.name } }
            );

            if (!model || model.length === 0) {
                console.log(`  NOT FOUND: ${tpl.name} (slug: ${tpl.modelSlug})`);
                notFound++;
                continue;
            }

            const m = model[0];
            const existing = await sequelize.query(
                `SELECT id FROM "DeviceTemplates" WHERE "deviceModelId" = :id LIMIT 1`,
                { replacements: { id: m.id } }
            );

            if (existing && existing[0] && existing[0].length > 0) {
                console.log(`  EXISTS: ${tpl.name}`);
                skipped++;
                continue;
            }

            await sequelize.query(`
                INSERT INTO "DeviceTemplates"
                ("deviceModelId", "caseWidth", "caseHeight", "cornerRadius", "bleedArea",
                 "safeAreaTop", "safeAreaBottom", "safeAreaLeft", "safeAreaRight",
                 "cameraX", "cameraY", "cameraWidth", "cameraHeight",
                 "basePrice", "isActive", "createdAt", "updatedAt")
                VALUES (:id, :cw, :ch, :cr, 3,
                        :sat, :sab, :sal, :sar,
                        :cx, :cy, :cw2, :ch2,
                        :bp, true, NOW(), NOW())
            `, {
                replacements: {
                    id: m.id, cw: tpl.cw, ch: tpl.ch, cr: tpl.cr,
                    sat: tpl.sa.t, sab: tpl.sa.b, sal: tpl.sa.l, sar: tpl.sa.r,
                    cx: tpl.cx, cy: tpl.cy, cw2: tpl.cw2, ch2: tpl.ch2,
                    bp: tpl.bp
                }
            });

            console.log(`  CREATED: ${tpl.name} (model #${m.id}) — ₹${tpl.bp}`);
            created++;
        }

        console.log(`\nDone: ${created} created, ${skipped} skipped, ${notFound} not found`);
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
