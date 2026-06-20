import { Request, Response } from 'express';
import { manufacturingService } from './manufacturing.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { CreateManufacturingOrderDto, ManufacturingOrderQueryDto } from './manufacturing.validator';

export class ManufacturingController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ManufacturingOrderQueryDto;
    const { data, total } = await manufacturingService.list(query);
    sendPaginated(res, data, total, query.page, query.limit, 'Manufacturing orders retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const order = await manufacturingService.getById(req.params['id']!);
    sendSuccess(res, order);
  }

  async create(req: Request, res: Response): Promise<void> {
    const order = await manufacturingService.createOrder(req.body as CreateManufacturingOrderDto);
    sendCreated(res, order, 'Manufacturing order created');
  }

  async confirm(req: Request, res: Response): Promise<void> {
    const order = await manufacturingService.confirmOrder(
      req.params['id']!,
      req.user!.id,
      req.user!.companyId,
    );
    sendSuccess(res, order, MESSAGES.MANUFACTURING.CONFIRM_SUCCESS);
  }

  async start(req: Request, res: Response): Promise<void> {
    const order = await manufacturingService.startOrder(
      req.params['id']!,
      req.user!.id,
      req.user!.companyId,
    );
    sendSuccess(res, order, MESSAGES.MANUFACTURING.START_SUCCESS);
  }

  async complete(req: Request, res: Response): Promise<void> {
    const order = await manufacturingService.completeOrder(
      req.params['id']!,
      req.user!.id,
      req.user!.companyId,
    );
    sendSuccess(res, order, MESSAGES.MANUFACTURING.COMPLETE_SUCCESS);
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    await manufacturingService.deleteOrder(req.params['id']!);
    sendSuccess(res, null, 'Manufacturing order deleted successfully');
  }
}

export const manufacturingController = new ManufacturingController();
