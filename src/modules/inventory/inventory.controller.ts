import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { InventoryQueryDto, StockAdjustmentDto } from './inventory.validator';

export class InventoryController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as InventoryQueryDto;
    const { data, total } = await inventoryService.list(query);
    sendPaginated(res, data, total, query.page, query.limit, 'Inventory retrieved');
  }

  async getStock(req: Request, res: Response): Promise<void> {
    const { warehouseId, productId } = req.params as { warehouseId: string; productId: string };
    const stock = await inventoryService.getStock(warehouseId, productId);
    sendSuccess(res, stock);
  }

  async adjustStock(req: Request, res: Response): Promise<void> {
    const dto = req.body as StockAdjustmentDto;
    await inventoryService.adjustStock(dto, req.user!.id, req.user!.companyId);
    sendSuccess(res, null, MESSAGES.INVENTORY.ADJUSTED);
  }
}

export const inventoryController = new InventoryController();
