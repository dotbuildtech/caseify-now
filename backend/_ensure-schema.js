require('dotenv').config();
const { sequelize } = require('./src/config/db');

(async () => {
  try {
    await sequelize.authenticate();
    // Create Materials table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Materials" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(80) NOT NULL UNIQUE,
        "slug" VARCHAR(100) NOT NULL UNIQUE,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMP WITH TIME ZONE
      )
    `);
    // Create CategoryMaterials table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "CategoryMaterials" (
        "id" SERIAL PRIMARY KEY,
        "categoryName" VARCHAR(120) NOT NULL,
        "MaterialId" INTEGER REFERENCES "Materials"(id) ON DELETE CASCADE,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("categoryName", "MaterialId")
      )
    `);
    // Create indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_catmat_category ON "CategoryMaterials"("categoryName")');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_catmat_material ON "CategoryMaterials"("MaterialId")');
    // Add materials column to Products
    await sequelize.query(`ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "materials" JSONB NOT NULL DEFAULT '[]'::jsonb`);
    // Add indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_materials_slug ON "Materials"("slug")');
    console.log('Schema ready');
    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e);
    process.exit(1);
  }
})();
