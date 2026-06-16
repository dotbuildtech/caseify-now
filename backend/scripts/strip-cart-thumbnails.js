require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/db');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const [rows] = await sequelize.query(
            `SELECT id, "designMeta" FROM "CartItems" WHERE "designMeta" IS NOT NULL`
        );

        let updated = 0;
        for (const row of rows) {
            const meta = row.designMeta;
            if (meta && meta.thumbnail) {
                const { thumbnail, ...rest } = meta;
                const hasKeys = Object.keys(rest).length > 0;
                await sequelize.query(
                    `UPDATE "CartItems" SET "designMeta" = $1 WHERE id = $2`,
                    { bind: [hasKeys ? JSON.stringify(rest) : null, row.id] }
                );
                updated++;
            }
        }

        console.log(`Stripped thumbnails from ${updated} cart items.`);
        console.log('Done.');
    } catch (e) {
        console.error('Failed:', e.message);
    } finally {
        await sequelize.close();
    }
})();
