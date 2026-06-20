import { Request, Response } from 'express';
import { bomService } from './bom.service';
import { sendSuccess, sendCreated } from '../../common/utils/response';
import { CreateBomDto, UpdateBomDto } from './bom.validator';

export class BomController {
  async list(req: Request, res: Response): Promise<void> {
    const companyId = req.query['companyId'] as string | undefined;
    const productId = req.query['productId'] as string | undefined;
    const boms = await bomService.list(companyId, productId);
    sendSuccess(res, boms, 'BOMs retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const bom = await bomService.getById(req.params['id']!);
    sendSuccess(res, bom);
  }

  async create(req: Request, res: Response): Promise<void> {
    const bom = await bomService.create(req.body as CreateBomDto);
    sendCreated(res, bom, 'BOM created successfully');
  }

  async update(req: Request, res: Response): Promise<void> {
    const bom = await bomService.update(req.params['id']!, req.body as UpdateBomDto);
    sendSuccess(res, bom, 'BOM updated successfully');
  }

  async delete(req: Request, res: Response): Promise<void> {
    await bomService.delete(req.params['id']!);
    sendSuccess(res, null, 'BOM deleted successfully');
  }
}

export const bomController = new BomController();
