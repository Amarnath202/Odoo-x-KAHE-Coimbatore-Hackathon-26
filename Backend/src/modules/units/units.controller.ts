import { Request, Response } from 'express';
import { unitsService } from './units.service';
import { sendSuccess, sendCreated } from '../../common/utils/response';

export class UnitsController {
  async list(_req: Request, res: Response): Promise<void> {
    const units = await unitsService.list();
    sendSuccess(res, units, 'Units retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const unit = await unitsService.getById(req.params['id']!);
    sendSuccess(res, unit);
  }

  async create(req: Request, res: Response): Promise<void> {
    const unit = await unitsService.create(req.body);
    sendCreated(res, unit, 'Unit created successfully');
  }

  async update(req: Request, res: Response): Promise<void> {
    const unit = await unitsService.update(req.params['id']!, req.body);
    sendSuccess(res, unit, 'Unit updated successfully');
  }

  async delete(req: Request, res: Response): Promise<void> {
    await unitsService.delete(req.params['id']!);
    sendSuccess(res, null, 'Unit deleted successfully');
  }
}

export const unitsController = new UnitsController();
