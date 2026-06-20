import { Request, Response } from 'express';
import { stockLedgerService } from './stock-ledger.service';
import { sendPaginated } from '../../common/utils/response';
import { parsePagination } from '../../common/utils/pagination';
import { LedgerMovementType } from '@prisma/client';

export class StockLedgerController {
  async list(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { data, total } = await stockLedgerService.list({
      warehouseId: req.query['warehouseId'] as string | undefined,
      productId: req.query['productId'] as string | undefined,
      companyId: req.query['companyId'] as string | undefined,
      movementType: req.query['movementType'] as LedgerMovementType | undefined,
      referenceType: req.query['referenceType'] as string | undefined,
      referenceId: req.query['referenceId'] as string | undefined,
      page,
      limit,
    });
    sendPaginated(res, data, total, page, limit, 'Stock ledger retrieved');
  }

  async getByProduct(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { data, total } = await stockLedgerService.getByProduct(req.params['productId']!, page, limit);
    sendPaginated(res, data, total, page, limit, 'Product stock ledger retrieved');
  }
}

export const stockLedgerController = new StockLedgerController();
