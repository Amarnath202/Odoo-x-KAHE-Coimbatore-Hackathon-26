import { Request, Response } from 'express';
import { auditLogsService } from './audit-logs.service';
import { sendPaginated } from '../../common/utils/response';
import { parsePagination } from '../../common/utils/pagination';
import { AuditAction } from '@prisma/client';

export class AuditLogsController {
  async list(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { data, total } = await auditLogsService.list({
      companyId: req.query['companyId'] as string | undefined,
      userId: req.query['userId'] as string | undefined,
      module: req.query['module'] as string | undefined,
      action: req.query['action'] as AuditAction | undefined,
      entityId: req.query['entityId'] as string | undefined,
      page,
      limit,
    });
    sendPaginated(res, data, total, page, limit, 'Audit logs retrieved');
  }
}

export const auditLogsController = new AuditLogsController();
