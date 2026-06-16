-- Optimize admin dashboard queries
-- Run: psql -f database/migrations/001_admin_dashboard_indexes.sql

CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON "Orders" ("paidAt");
CREATE INDEX IF NOT EXISTS idx_orders_is_paid ON "Orders" ("isPaid");
CREATE INDEX IF NOT EXISTS idx_orders_is_paid_paid_at ON "Orders" ("isPaid", "paidAt");
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON "Orders" ("orderStatus", "createdAt");
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON "Users" ("isVerified");
CREATE INDEX IF NOT EXISTS idx_products_stock_threshold ON "Products" ("stock", "lowStockThreshold");
