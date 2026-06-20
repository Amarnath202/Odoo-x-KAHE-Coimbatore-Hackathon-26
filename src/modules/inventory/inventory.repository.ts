import { Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class InventoryRepository {
  /**
   * Find or create inventory record for a warehouse + product pair
   */
  async findOrCreate(warehouseId: string, productId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const existing = await client.inventory.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });

    if (existing) return existing;

    return client.inventory.create({
      data: {
        warehouseId,
        productId,
        onHandQty: 0,
        reservedQty: 0,
        freeToUseQty: 0,
      },
    });
  }

  async findByWarehouseAndProduct(
    warehouseId: string,
    productId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;
    return client.inventory.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });
  }

  async findMany(filters: {
    warehouseId?: string;
    productId?: string;
    companyId?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.InventoryWhereInput = {
      ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
      ...(filters.productId && { productId: filters.productId }),
      ...(filters.companyId && { warehouse: { companyId: filters.companyId } }),
    };

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true, unit: { select: { symbol: true } } } },
          warehouse: { select: { id: true, name: true, location: true } },
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { product: { name: 'asc' } },
      }),
      prisma.inventory.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Update inventory quantities and recalculate freeToUseQty
   * freeToUseQty = onHandQty - reservedQty
   */
  async updateQuantities(
    warehouseId: string,
    productId: string,
    updates: Partial<{ onHandQty: number; reservedQty: number }>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;
    const current = await this.findOrCreate(warehouseId, productId, tx);

    const newOnHand =
      updates.onHandQty !== undefined ? updates.onHandQty : Number(current.onHandQty);
    const newReserved =
      updates.reservedQty !== undefined ? updates.reservedQty : Number(current.reservedQty);
    const newFreeToUse = Math.max(0, newOnHand - newReserved);

    return client.inventory.update({
      where: { warehouseId_productId: { warehouseId, productId } },
      data: {
        onHandQty: newOnHand,
        reservedQty: newReserved,
        freeToUseQty: newFreeToUse,
      },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
