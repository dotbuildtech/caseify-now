-- ============================================================
-- Migration: Filter Performance Indexes
-- Target: Reduce /api/filters response time from ~3s to <200ms
-- ============================================================

-- 1. Brand indexes for filter lookups
CREATE INDEX IF NOT EXISTS idx_brands_is_active
    ON "Brands" ("isActive")
    WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_brands_is_active_name
    ON "Brands" ("isActive", "name")
    WHERE "isActive" = true;

-- 2. Category indexes
CREATE INDEX IF NOT EXISTS idx_categories_is_active
    ON "Categories" ("isActive")
    WHERE "isActive" = true;

-- 3. CategoryBrand indexes (critical for brand-by-category lookups)
CREATE INDEX IF NOT EXISTS idx_category_brands_active
    ON "CategoryBrands" ("categoryName", "isActive")
    WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_category_brands_active_brand
    ON "CategoryBrands" ("categoryName", "isActive", "BrandId")
    WHERE "isActive" = true;

-- 4. DeviceModel indexes (critical for model-by-brand lookups)
CREATE INDEX IF NOT EXISTS idx_device_models_brand_active
    ON "DeviceModels" ("BrandId", "isActive")
    WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_device_models_brand_active_name
    ON "DeviceModels" ("BrandId", "isActive", "name")
    WHERE "isActive" = true;

-- 5. FilterOption indexes
CREATE INDEX IF NOT EXISTS idx_filter_options_key_active
    ON "FilterOptions" ("key", "isActive", "sortOrder", "value")
    WHERE "isActive" = true;

-- 6. Product indexes for MIN/MAX price aggregation
CREATE INDEX IF NOT EXISTS idx_products_active_price
    ON "Products" ("isActive", "price")
    WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS idx_products_active_category_price
    ON "Products" ("isActive", "category", "price")
    WHERE "isActive" = true;

-- 7. Product attribute JSONB index (for faster attribute filtering)
CREATE INDEX IF NOT EXISTS idx_products_attributes_gin
    ON "Products" USING gin ("attributes" jsonb_path_ops);

-- 8. Product brand index for filter lookups
CREATE INDEX IF NOT EXISTS idx_products_active_brand
    ON "Products" ("isActive", "brand")
    WHERE "isActive" = true AND "brand" IS NOT NULL;

-- 9. Product category index for filter queries
CREATE INDEX IF NOT EXISTS idx_products_active_category
    ON "Products" ("isActive", "category")
    WHERE "isActive" = true;

-- 10. Composite covering index for the price-range query
CREATE INDEX IF NOT EXISTS idx_products_price_active_covering
    ON "Products" ("isActive", "price")
    INCLUDE ("id")
    WHERE "isActive" = true;

-- Analyze all tables to update query planner statistics
ANALYZE "Brands";
ANALYZE "Categories";
ANALYZE "CategoryBrands";
ANALYZE "DeviceModels";
ANALYZE "FilterOptions";
ANALYZE "Products";

-- ============================================================
-- Index Summary:
-- Total new indexes: 13
-- Estimated improvement: 10x-50x on filter queries
-- ============================================================
