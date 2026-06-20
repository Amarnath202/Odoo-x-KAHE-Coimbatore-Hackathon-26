import { PrismaClient, LedgerMovementType } from '@prisma/client';
import { inventoryService } from '../src/modules/inventory/inventory.service';
import { eventEmitter } from '../src/common/events/eventEmitter';

const prisma = new PrismaClient();

async function runTest() {
  console.log('--- STARTING INVENTORY REGRESSION TEST ---');

  const companyId = 'c1000000-0000-0000-0000-000000000001';
  const warehouse = await prisma.warehouse.findFirst({ where: { companyId } });
  const product = await prisma.product.findFirst({ where: { sku: 'RAW-LEG-001' } });
  
  if (!warehouse || !product) {
    throw new Error('Could not find warehouse or product in DB');
  }
  
  const warehouseId = warehouse.id;
  const productId = product.id;
  const userId = 'user0001-0000-0000-0000-000000000001';

  try {
    // 1. Initial State: Set exactly 100 on hand
    console.log('\n[1] Initializing stock to 100 on hand...');
    await prisma.$transaction(async (tx) => {
      await tx.inventory.upsert({
        where: { warehouseId_productId: { warehouseId, productId } },
        update: { onHandQty: 100, reservedQty: 0, freeToUseQty: 100 },
        create: { warehouseId, productId, onHandQty: 100, reservedQty: 0, freeToUseQty: 100 },
      });
    });

    let inv = await prisma.inventory.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
    console.log(`Initial Inventory: OnHand: ${inv?.onHandQty}, Reserved: ${inv?.reservedQty}, Free: ${inv?.freeToUseQty}`);

    // 2. Sales Order Confirm (Reserve) - Qty 200
    // We only reserve the available 100.
    console.log('\n[2] Simulating Sales Order Confirm (Need 200, Available 100)...');
    await prisma.$transaction(async (tx) => {
      await inventoryService.reserveStock({
        warehouseId,
        productId,
        quantity: 100, // reserving what is available
        referenceType: 'SALES_ORDER',
        referenceId: 'TEST-SO-1',
        userId,
        tx,
      });
    });

    inv = await prisma.inventory.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
    console.log(`After Confirm: OnHand: ${inv?.onHandQty}, Reserved: ${inv?.reservedQty}, Free: ${inv?.freeToUseQty}`);
    
    if (Number(inv?.onHandQty) !== 100 || Number(inv?.reservedQty) !== 100 || Number(inv?.freeToUseQty) !== 0) {
      throw new Error('Test failed at Confirm phase');
    }

    // 3. Purchase Order Receive - Qty 100 (shortage fulfillment)
    console.log('\n[3] Simulating Purchase Order Receive (Shortage 100)...');
    await prisma.$transaction(async (tx) => {
      await inventoryService.addStock({
        warehouseId,
        productId,
        quantity: 100,
        movementType: LedgerMovementType.PURCHASE_RECEIPT,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'TEST-PO-1',
        userId,
        tx,
      });
    });

    inv = await prisma.inventory.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
    console.log(`After PO Receive: OnHand: ${inv?.onHandQty}, Reserved: ${inv?.reservedQty}, Free: ${inv?.freeToUseQty}`);
    
    if (Number(inv?.onHandQty) !== 200 || Number(inv?.reservedQty) !== 100 || Number(inv?.freeToUseQty) !== 100) {
      throw new Error('Test failed at PO Receive phase');
    }

    // 4. Sales Order Deliver - Qty 200
    console.log('\n[4] Simulating Sales Order Deliver (Deliver all 200)...');
    await prisma.$transaction(async (tx) => {
      await inventoryService.deductStock({
        warehouseId,
        productId,
        quantity: 200,
        movementType: LedgerMovementType.SALES_DELIVERY,
        referenceType: 'SALES_ORDER',
        referenceId: 'TEST-SO-1',
        userId,
        tx,
      });
    });

    inv = await prisma.inventory.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
    console.log(`After SO Deliver: OnHand: ${inv?.onHandQty}, Reserved: ${inv?.reservedQty}, Free: ${inv?.freeToUseQty}`);

    if (Number(inv?.onHandQty) !== 0 || Number(inv?.reservedQty) !== 0 || Number(inv?.freeToUseQty) !== 0) {
      throw new Error('Test failed at SO Deliver phase');
    }

    console.log('\n✅ TEST PASSED: Inventory calculations are perfectly consistent.');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
