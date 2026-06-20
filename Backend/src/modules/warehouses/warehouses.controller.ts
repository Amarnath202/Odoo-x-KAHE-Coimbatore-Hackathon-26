import { Request, Response } from 'express';
import { warehousesService } from './warehouses.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { parsePagination } from '../../common/utils/pagination';

export class WarehousesController {
  async list(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const companyId = req.query['companyId'] as string | undefined;
    const { data, total } = await warehousesService.list(companyId, page, limit);
    sendPaginated(res, data, total, page, limit, 'Warehouses retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const wh = await warehousesService.getById(req.params['id']!);
    sendSuccess(res, wh);
  }

  async create(req: Request, res: Response): Promise<void> {
    const wh = await warehousesService.create(req.body);
    sendCreated(res, wh, 'Warehouse created successfully');
  }

  async update(req: Request, res: Response): Promise<void> {
    const wh = await warehousesService.update(req.params['id']!, req.body);
    sendSuccess(res, wh, 'Warehouse updated successfully');
  }
}

export const warehousesController = new WarehousesController();
