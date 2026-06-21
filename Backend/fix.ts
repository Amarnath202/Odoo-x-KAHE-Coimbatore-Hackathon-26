import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe(`UPDATE "manufacturing_orders" SET "status" = 'DRAFT'`);
  await prisma.$executeRawUnsafe(`UPDATE "audit_logs" SET "old_value" = '{}', "new_value" = '{}' WHERE "module" = 'MANUFACTURING'`);
}
run().catch(console.error).finally(() => prisma.$disconnect());
