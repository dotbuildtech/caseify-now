require('dotenv').config();
const { sequelize } = require('./src/config/db');

const run = async (sql) => {
    try {
        await sequelize.query(sql);
        console.log(`  OK: ${sql.substring(0, 80)}...`);
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log(`  SKIP (exists): ${sql.substring(0, 80)}...`);
        } else {
            console.error(`  FAIL: ${err.message}`);
        }
    }
};

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to Neon DB');

        // Add itemsPrice column to Orders
        await run(`ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "itemsPrice" DECIMAL(12,2) NOT NULL DEFAULT 0;`);

        // Drop FK constraints that block custom product IDs (9999) in CartItems/OrderItems
        await run(`ALTER TABLE "CartItems" DROP CONSTRAINT IF EXISTS "CartItems_ProductId_fkey";`);
        await run(`ALTER TABLE "CartItems" DROP CONSTRAINT IF EXISTS "CartItems_ProductVariantId_fkey";`);
        await run(`ALTER TABLE "OrderItems" DROP CONSTRAINT IF EXISTS "OrderItems_ProductId_fkey";`);

        // Add productSnapshot column to OrderItems for fulfillment details
        await run(`ALTER TABLE "OrderItems" ADD COLUMN IF NOT EXISTS "productSnapshot" JSONB;`);

        // Add missing indexes
        await run(`CREATE INDEX IF NOT EXISTS idx_orders_userid ON "Orders" ("UserId");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_orders_orderstatus ON "Orders" ("orderStatus");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_orders_createdat ON "Orders" ("createdAt");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_invoices_orderid ON "Invoices" ("OrderId");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_invoices_userid ON "Invoices" ("UserId");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_paymentrecords_userid ON "PaymentRecords" ("UserId");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_paymentrecords_orderid ON "PaymentRecords" ("OrderId");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_expenses_supplierid ON "Expenses" ("SupplierId");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_inventories_productid ON "Inventories" ("ProductId");`);
        await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_inventories_productid_uq ON "Inventories" ("ProductId");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_inventories_quantity ON "Inventories" ("quantity");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_inventories_threshold ON "Inventories" ("lowStockThreshold");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_designs_userid ON "Designs" ("UserId");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_designs_productid ON "Designs" ("ProductId");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_designs_popularity ON "Designs" ("popularity");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_campaigns_isactive ON "Campaigns" ("isActive");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_campaigns_enddate ON "Campaigns" ("endDate");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_suppliers_isactive ON "Suppliers" ("isActive");`);

        await run(`CREATE INDEX IF NOT EXISTS idx_products_active_category_price ON "Products" ("isActive", "category", "price");`);
        await run(`CREATE INDEX IF NOT EXISTS idx_products_featured_active ON "Products" ("isFeatured", "isActive");`);

        // Add UserId FK index for Orders if missing
        await run(`CREATE INDEX IF NOT EXISTS idx_orders_userid_fk ON "Orders" ("UserId");`);

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
})();
