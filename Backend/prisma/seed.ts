import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Company ──────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: 'c1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'c1000000-0000-0000-0000-000000000001',
      name: 'Shiv Furniture Works',
      address: '123 Industrial Area, Jodhpur, Rajasthan 342001',
      phone: '+91-291-2345678',
      email: 'info@shivfurniture.com',
    },
  });
  console.log(`✅ Company: ${company.name}`);

  // ─── Warehouses ───────────────────────────────────────────
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { id: 'w1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'w1000000-0000-0000-0000-000000000001',
      companyId: company.id,
      name: 'Main Warehouse',
      location: 'Block A, Industrial Area, Jodhpur',
    },
  });

  const rawMaterialStore = await prisma.warehouse.upsert({
    where: { id: 'w1000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'w1000000-0000-0000-0000-000000000002',
      companyId: company.id,
      name: 'Raw Materials Store',
      location: 'Block B, Industrial Area, Jodhpur',
    },
  });
  console.log(`✅ Warehouses: ${mainWarehouse.name}, ${rawMaterialStore.name}`);

  // ─── Units ────────────────────────────────────────────────
  const units = await Promise.all([
    prisma.unit.upsert({ where: { symbol: 'PCS' }, update: {}, create: { name: 'Pieces', symbol: 'PCS' } }),
    prisma.unit.upsert({ where: { symbol: 'KG' }, update: {}, create: { name: 'Kilograms', symbol: 'KG' } }),
    prisma.unit.upsert({ where: { symbol: 'MTR' }, update: {}, create: { name: 'Meters', symbol: 'MTR' } }),
    prisma.unit.upsert({ where: { symbol: 'BOX' }, update: {}, create: { name: 'Box', symbol: 'BOX' } }),
    prisma.unit.upsert({ where: { symbol: 'SET' }, update: {}, create: { name: 'Set', symbol: 'SET' } }),
  ]);
  const pcsUnit = units[0];
  console.log(`✅ Units: ${units.map(u => u.symbol).join(', ')}`);

  // ─── Categories ───────────────────────────────────────────
  const [furnitureCat, rawMatCat, hardwareCat] = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat00001-0000-0000-0000-000000000001' },
      update: {},
      create: { id: 'cat00001-0000-0000-0000-000000000001', companyId: company.id, name: 'Furniture' },
    }),
    prisma.category.upsert({
      where: { id: 'cat00001-0000-0000-0000-000000000002' },
      update: {},
      create: { id: 'cat00001-0000-0000-0000-000000000002', companyId: company.id, name: 'Raw Materials' },
    }),
    prisma.category.upsert({
      where: { id: 'cat00001-0000-0000-0000-000000000003' },
      update: {},
      create: { id: 'cat00001-0000-0000-0000-000000000003', companyId: company.id, name: 'Hardware' },
    }),
  ]);
  console.log(`✅ Categories: Furniture, Raw Materials, Hardware`);

  // ─── Vendor ───────────────────────────────────────────────
  const vendor = await prisma.vendor.upsert({
    where: { id: 'v1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'v1000000-0000-0000-0000-000000000001',
      companyId: company.id,
      name: 'Wood Supplies Co.',
      email: 'vendor@woodsupplies.com',
      phone: '+91-291-9876543',
      address: 'Timber Market, Jodhpur',
    },
  });
  console.log(`✅ Vendor: ${vendor.name}`);

  // ─── Products ─────────────────────────────────────────────
  const tableLegs = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'RAW-LEG-001' } },
    update: {},
    create: {
      companyId: company.id, sku: 'RAW-LEG-001', name: 'Table Leg (Wood)',
      categoryId: rawMatCat.id, unitId: pcsUnit.id, salesPrice: 150, costPrice: 80,
      procureOnDemand: true, procurementType: 'PURCHASE', vendorId: vendor.id,
    },
  });

  const tableTop = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'RAW-TOP-001' } },
    update: {},
    create: {
      companyId: company.id, sku: 'RAW-TOP-001', name: 'Table Top (Teak)',
      categoryId: rawMatCat.id, unitId: pcsUnit.id, salesPrice: 1200, costPrice: 700,
      procureOnDemand: true, procurementType: 'PURCHASE', vendorId: vendor.id,
    },
  });

  const screws = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'RAW-SCR-001' } },
    update: {},
    create: {
      companyId: company.id, sku: 'RAW-SCR-001', name: 'Wood Screws (Pack of 100)',
      categoryId: hardwareCat.id, unitId: pcsUnit.id, salesPrice: 50, costPrice: 25,
      procureOnDemand: true, procurementType: 'PURCHASE', vendorId: vendor.id,
    },
  });
  console.log(`✅ Component Products: Table Legs, Table Top, Screws`);

  // ─── Finished Product ─────────────────────────────────────
  const woodenTable = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: 'FG-TBL-001' } },
    update: {},
    create: {
      companyId: company.id, sku: 'FG-TBL-001', name: 'Wooden Table (Teak)',
      categoryId: furnitureCat.id, unitId: pcsUnit.id, salesPrice: 5000, costPrice: 3000,
      procureOnDemand: true, procurementType: 'MANUFACTURING',
    },
  });
  console.log(`✅ Finished Product: ${woodenTable.name}`);

  // ─── Bill of Materials ────────────────────────────────────
  const bom = await prisma.bom.upsert({
    where: { id: 'bom00001-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'bom00001-0000-0000-0000-000000000001',
      companyId: company.id,
      productId: woodenTable.id,
      name: 'Wooden Table BOM v1.0',
      version: '1.0',
      components: {
        create: [
          { productId: tableLegs.id, quantity: 4, unitId: pcsUnit.id },
          { productId: tableTop.id, quantity: 1, unitId: pcsUnit.id },
          { productId: screws.id, quantity: 12, unitId: pcsUnit.id },
        ],
      },
      operations: {
        create: [
          { name: 'Wood Cutting', sequence: 1, durationMinutes: 30 },
          { name: 'Assembly', sequence: 2, durationMinutes: 60 },
          { name: 'Sanding & Finishing', sequence: 3, durationMinutes: 45 },
          { name: 'Painting / Polishing', sequence: 4, durationMinutes: 40 },
          { name: 'Quality Check & Packing', sequence: 5, durationMinutes: 15 },
        ],
      },
    },
  });

  // Link BOM to product
  await prisma.product.update({ where: { id: woodenTable.id }, data: { bomId: bom.id } });
  console.log(`✅ BOM: ${bom.name}`);

  // ─── Initial Inventory ────────────────────────────────────
  await Promise.all([
    prisma.inventory.upsert({
      where: { warehouseId_productId: { warehouseId: rawMaterialStore.id, productId: tableLegs.id } },
      update: {},
      create: { warehouseId: rawMaterialStore.id, productId: tableLegs.id, onHandQty: 100, reservedQty: 0, freeToUseQty: 100 },
    }),
    prisma.inventory.upsert({
      where: { warehouseId_productId: { warehouseId: rawMaterialStore.id, productId: tableTop.id } },
      update: {},
      create: { warehouseId: rawMaterialStore.id, productId: tableTop.id, onHandQty: 50, reservedQty: 0, freeToUseQty: 50 },
    }),
    prisma.inventory.upsert({
      where: { warehouseId_productId: { warehouseId: rawMaterialStore.id, productId: screws.id } },
      update: {},
      create: { warehouseId: rawMaterialStore.id, productId: screws.id, onHandQty: 500, reservedQty: 0, freeToUseQty: 500 },
    }),
    prisma.inventory.upsert({
      where: { warehouseId_productId: { warehouseId: mainWarehouse.id, productId: woodenTable.id } },
      update: {},
      create: { warehouseId: mainWarehouse.id, productId: woodenTable.id, onHandQty: 10, reservedQty: 0, freeToUseQty: 10 },
    }),
  ]);
  console.log(`✅ Inventory: seeded component and finished goods stock`);

  // ─── Customer ─────────────────────────────────────────────
  await prisma.customer.upsert({
    where: { id: 'cust0001-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'cust0001-0000-0000-0000-000000000001',
      companyId: company.id,
      name: 'Raj Home Furnishings',
      email: 'orders@rajhome.com',
      phone: '+91-98765-43210',
      address: 'MG Road, Jaipur, Rajasthan',
    },
  });
  console.log(`✅ Customer: Raj Home Furnishings`);

  // ─── Users ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12);
  const users = [
    { id: 'user0001-0000-0000-0000-000000000001', name: 'System Admin', email: 'admin123@gmail.com', role: Role.ADMIN },
    { id: 'user0001-0000-0000-0000-000000000002', name: 'Ramesh Sharma', email: 'sales@shivfurniture.com', role: Role.SALES_USER },
    { id: 'user0001-0000-0000-0000-000000000003', name: 'Suresh Gupta', email: 'purchase@shivfurniture.com', role: Role.PURCHASE_USER },
    { id: 'user0001-0000-0000-0000-000000000004', name: 'Vikram Singh', email: 'mfg@shivfurniture.com', role: Role.MANUFACTURING_USER },
    { id: 'user0001-0000-0000-0000-000000000005', name: 'Priya Patel', email: 'inventory@shivfurniture.com', role: Role.INVENTORY_MANAGER },
    { id: 'user0001-0000-0000-0000-000000000006', name: 'Shiv Kumar', email: 'owner@shivfurniture.com', role: Role.BUSINESS_OWNER },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { email: u.email, passwordHash: passwordHash },
      create: { ...u, companyId: company.id, passwordHash, isActive: true },
    });
  }
  console.log(`✅ Users: ${users.map(u => u.role).join(', ')}`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo Login Credentials (all passwords: admin123):');
  console.log('  admin123@gmail.com          → ADMIN');
  console.log('  sales@shivfurniture.com     → SALES_USER');
  console.log('  purchase@shivfurniture.com  → PURCHASE_USER');
  console.log('  mfg@shivfurniture.com       → MANUFACTURING_USER');
  console.log('  inventory@shivfurniture.com → INVENTORY_MANAGER');
  console.log('  owner@shivfurniture.com     → BUSINESS_OWNER');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
