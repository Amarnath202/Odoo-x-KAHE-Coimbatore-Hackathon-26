import { LedgerMovementType, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class StockLedgerRepository {
  async findMany(filters: {
    warehouseId?: string;
    productId?: string;
    companyId?: string;
    movementType?: LedgerMovementType;
    referenceType?: string;
    referenceId?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.StockLedgerWhereInput = {
      ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
      ...(filters.productId && { productId: filters.productId }),
      ...(filters.movementType && { movementType: filters.movementType }),
      ...(filters.referenceType && { referenceType: filters.referenceType }),
      ...(filters.referenceId && { referenceId: filters.referenceId }),
      ...(filters.companyId && { warehouse: { companyId: filters.companyId } }),
    };

    const [data, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockLedger.count({ where }),
    ]);

    return { data, total };
  }

  async findByProduct(productId: string, page = 1, limit = 20) {
    const where = { productId };
    const [data, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockLedger.count({ where }),
    ]);
    return { data, total };
  }
}

export const stockLedgerRepository = new StockLedgerRepository();
