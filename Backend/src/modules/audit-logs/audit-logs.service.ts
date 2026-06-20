import { AuditAction } from '@prisma/client';
import { auditLogsRepository } from './audit-logs.repository';

export interface AuditLogQuery {
  companyId?: string;
  userId?: string;
  module?: string;
  action?: AuditAction;
  entityId?: string;
  page: number;
  limit: number;
}

export class AuditLogsService {
  async list(query: AuditLogQuery) {
    return auditLogsRepository.findMany(query);
  }

  async getExportData(companyId?: string, month?: number, year?: number) {
    return auditLogsRepository.findForExport(companyId, month, year);
  }
}

export const auditLogsService = new AuditLogsService();
