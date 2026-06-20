import { Request, Response } from 'express';
import { auditLogsService } from './audit-logs.service';
import { sendPaginated } from '../../common/utils/response';
import { parsePagination } from '../../common/utils/pagination';
import { AuditAction } from '@prisma/client';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

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

  async exportExcel(req: Request, res: Response): Promise<void> {
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const companyId = req.user?.companyId;

    const logs = await auditLogsService.getExportData(companyId, month, year);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Logs');

    worksheet.columns = [
      { header: 'User Name', key: 'userName', width: 25 },
      { header: 'User Role', key: 'userRole', width: 20 },
      { header: 'Action Performed', key: 'action', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Timestamp', key: 'timestamp', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const log of logs) {
      worksheet.addRow({
        userName: log.user?.name || 'System',
        userRole: log.user?.role || 'System',
        action: log.action,
        module: log.module,
        description: `Entity: ${log.entityId || 'N/A'}`,
        timestamp: dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    let fileName = 'audit_logs.xlsx';
    if (month && year) {
      fileName = `audit_logs_${dayjs().month(month - 1).format('MMMM').toLowerCase()}_${year}.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  }
}

export const auditLogsController = new AuditLogsController();
