-- Create the independent Studio Templates table (v2)
CREATE TABLE IF NOT EXISTS "StudioTemplatesV2" (
    id SERIAL PRIMARY KEY,
    "brandId" INTEGER NOT NULL REFERENCES "Brands"(id) ON DELETE CASCADE,
    "modelId" INTEGER NOT NULL REFERENCES "DeviceModels"(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    description TEXT,
    "previewImage" TEXT NOT NULL,
    thumbnail TEXT,
    "maskSvg" TEXT NOT NULL,
    "cameraSvg" TEXT NOT NULL,
    "safeAreaSvg" TEXT,
    "bleedSvg" TEXT,
    "outlineSvg" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    UNIQUE("brandId", "modelId", "version")
);

CREATE INDEX IF NOT EXISTS idx_studio_templates_v2_brand ON "StudioTemplatesV2"("brandId");
CREATE INDEX IF NOT EXISTS idx_studio_templates_v2_model ON "StudioTemplatesV2"("modelId");
CREATE INDEX IF NOT EXISTS idx_studio_templates_v2_status ON "StudioTemplatesV2"(status);
