const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'seedStudioTemplates.sql'), 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt + ';');
      console.log('Executed:', stmt.substring(0, 80) + '...');
    } catch (err) {
      if (err.code === 'P2010' || err.message?.includes('already exists')) {
        console.log('Skipped (already exists):', stmt.substring(0, 80) + '...');
      } else {
        throw err;
      }
    }
  }
  console.log('StudioTemplatesV2 table ready.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
