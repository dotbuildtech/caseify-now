require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/db');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        await sequelize.query(`ALTER TABLE "OrderItems" ALTER COLUMN "image" TYPE TEXT`);
        console.log('OrderItems.image -> TEXT');
        await sequelize.query(`ALTER TABLE "OrderItems" ALTER COLUMN "name" TYPE VARCHAR(500)`);
        console.log('OrderItems.name -> VARCHAR(500)');
        console.log('Done.');
    } catch (e) {
        console.error('Failed:', e.message);
    } finally {
        await sequelize.close();
    }
})();
