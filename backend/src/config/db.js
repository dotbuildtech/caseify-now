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
        const dbStart = Date.now();
        await sequelize.authenticate();
        const authTime = Date.now() - dbStart;
        console.log(`PostgreSQL Connected... (${authTime}ms)`);

        const assoStart = Date.now();
        require('../models/associations');
        const assoTime = Date.now() - assoStart;
        if (assoTime > 100) console.log(`[startup] Associations loaded in ${assoTime}ms`);

        const skipSync = process.env.SKIP_DB_SYNC === 'true' || process.env.NODE_ENV === 'production';
        if (skipSync) {
            console.log(`Skipping schema sync (${process.env.NODE_ENV === 'production' ? 'production' : 'SKIP_DB_SYNC=true'})`);
        } else {
            await sequelize.sync({ alter: false });
            console.log('Database synced');
        }

        // Auto-migration: add missing columns to EditableAreas
        try {
            await sequelize.query(`
                ALTER TABLE "EditableAreas"
                ADD COLUMN IF NOT EXISTS "borderRadius" FLOAT NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "borderRadiusTop" FLOAT NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "borderRadiusBottom" FLOAT NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "polygonSides" INTEGER DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS "pathData" TEXT DEFAULT NULL
            `);
        } catch (e) {
            console.warn('[migration] Could not add radius/polygon/pathData columns (non-critical):', e.message);
        }

        try {
            await sequelize.query(`
                ALTER TABLE "EditableAreas"
                ALTER COLUMN "shapeType" TYPE VARCHAR(50)
            `);
        } catch (e) {
            console.warn('[migration] Could not alter shapeType column (non-critical):', e.message);
        }

        // Add visibleBounds column to StudioTemplates
        try {
            await sequelize.query(`
                ALTER TABLE "StudioTemplates"
                ADD COLUMN IF NOT EXISTS "visibleBounds" JSONB DEFAULT NULL
            `);
        } catch (e) {
            console.warn('[migration] Could not add visibleBounds column (non-critical):', e.message);
        }

        try {
            await sequelize.query(`
                ALTER TABLE "EditableAreas"
                ADD COLUMN IF NOT EXISTS "backgroundColor" VARCHAR(20) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS "guideText" TEXT DEFAULT NULL
            `);
        } catch (e) {
            console.warn('[migration] Could not add background color columns (non-critical):', e.message);
        }

        // Performance indexes for dashboard/admin queries
        try {
            await sequelize.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_ispaid_paidat
                ON "Orders" ("isPaid", "paidAt")
                WHERE "isPaid" = true
            `).catch(() => {});
        } catch (e) {
            console.warn('[migration] Could not create idx_orders_ispaid_paidat (non-critical):', e.message);
        }
        try {
            await sequelize.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_isverified
                ON "Users" ("isVerified")
            `).catch(() => {});
        } catch (e) {
            console.warn('[migration] Could not create idx_users_isverified (non-critical):', e.message);
        }

        setInterval(async () => {
            try {
                await sequelize.authenticate();
            } catch (err) {
                console.error('[db] Health check failed:', err.message);
                try {
                    await sequelize.connectionManager.init();
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
