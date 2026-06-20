import { Request, Response } from 'express';
import { procurementService } from './procurement.service';
import { sendSuccess, sendPaginated } from '../../common/utils/response';
import { parsePagination } from '../../common/utils/pagination';
import { MESSAGES } from '../../common/constants/messages';
import { z } from 'zod';
import { AppError } from '../../common/utils/AppError';

const manualTriggerSchema = z.object({
  productId: z.string().uuid(),
  shortageQty: z.coerce.number().positive(),
});

export class ProcurementController {
  async getLogs(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const companyId = req.query['companyId'] as string | undefined;
    const { data, total } = await procurementService.getLogs(companyId, page, limit);
    sendPaginated(res, data, total, page, limit, 'Procurement logs retrieved');
  }

  async manualTrigger(req: Request, res: Response): Promise<void> {
    const parsed = manualTriggerSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input');

    const result = await procurementService.manualTrigger(
      parsed.data.productId,
      parsed.data.shortageQty,
      req.user!.companyId,
      req.user!.id,
    );
    sendSuccess(res, result, MESSAGES.PROCUREMENT.TRIGGERED);
  }
}

export const procurementController = new ProcurementController();
