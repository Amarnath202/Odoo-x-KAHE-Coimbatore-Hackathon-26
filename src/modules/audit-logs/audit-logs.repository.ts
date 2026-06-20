import { AuditAction, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class AuditLogsRepository {
  async findMany(filters: {
    companyId?: string;
    userId?: string;
    module?: string;
    action?: AuditAction;
    entityId?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.module && { module: { equals: filters.module, mode: 'insensitive' } }),
      ...(filters.action && { action: filters.action }),
      ...(filters.entityId && { entityId: filters.entityId }),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }
}

export const auditLogsRepository = new AuditLogsRepository();
