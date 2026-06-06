const { Sequelize } = require('sequelize');
const validateEnv = require('../utils/validateEnv');

validateEnv();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected...');

        if (process.env.NODE_ENV === 'production') {
            console.log('Production: skipping automatic schema sync (use migrations)');
        } else {
            await sequelize.sync({ alter: true });
            console.log('Database synced (alter mode - dev only)');
        }
    } catch (error) {
        console.error(`Database error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
