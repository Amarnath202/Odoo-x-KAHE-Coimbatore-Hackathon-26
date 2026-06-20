import prisma from '../../config/database';

export class ProcurementRepository {
  async logProcurement(data: {
    companyId: string;
    triggerSource: string;
    productId: string;
    shortageQty: number;
    generatedOrderType: string;
    generatedOrderId?: string;
  }) {
    return prisma.procurementLog.create({ data });
  }

  async findLogs(companyId?: string, page = 1, limit = 20) {
    const where = companyId ? { companyId } : {};
    const [data, total] = await Promise.all([
      prisma.procurementLog.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true } },
          company: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.procurementLog.count({ where }),
    ]);
    return { data, total };
  }
}

export const procurementRepository = new ProcurementRepository();
