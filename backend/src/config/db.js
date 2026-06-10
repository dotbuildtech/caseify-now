const { Sequelize } = require('sequelize');
const validateEnv = require('../utils/validateEnv');

validateEnv();

const isSSLDisabled = process.env.DB_SSL_DISABLE === 'true';
const isNeon = process.env.DATABASE_URL?.includes('neon.tech');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.DB_LOG === 'true' ? (sql, timing) => {
        if (timing > 100) console.log(`[slow query ${timing}ms] ${sql}`);
    } : false,
    dialectOptions: {
        ...(isSSLDisabled ? {} : {
            ssl: {
                require: true,
                rejectUnauthorized: true
            }
        }),
        connectionTimeoutMillis: 30000,
        idle_in_transaction_session_timeout: 60000,
        ...(isNeon ? { keepAlive: true, keepAliveInitialDelay: 10000 } : {})
    },
    pool: {
        max: parseInt(process.env.DB_POOL_MAX, 10) || (isNeon ? 5 : 15),
        min: parseInt(process.env.DB_POOL_MIN, 10) || (isNeon ? 1 : 2),
        acquire: 30000,
        idle: 300000,
        evict: 10000
    },
    retry: {
        match: [
            /Connection terminated unexpectedly/,
            /Connection refused/,
            /ETIMEDOUT/,
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeConnectionTimedOutError/
        ],
        max: 2,
        backoffBase: 1000,
        backoffExponent: 2
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected...');

        require('../models/associations');

        const skipSync = process.env.SKIP_DB_SYNC === 'true' || process.env.NODE_ENV === 'production';
        if (skipSync) {
            console.log(`Skipping schema sync (${process.env.NODE_ENV === 'production' ? 'production' : 'SKIP_DB_SYNC=true'})`);
        } else {
            await sequelize.sync({ alter: false });
            console.log('Database synced');
        }

        setInterval(async () => {
            try {
                await sequelize.authenticate();
            } catch (err) {
                console.error('[db] Health check failed:', err.message);
                try {
                    await sequelize.close();
                    await sequelize.authenticate();
                    console.log('[db] Reconnected successfully');
                } catch (reconnectErr) {
                    console.error('[db] Reconnect failed:', reconnectErr.message);
                }
            }
        }, 60000);
    } catch (error) {
        console.error(`Database error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
