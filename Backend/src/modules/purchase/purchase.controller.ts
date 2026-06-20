import { Request, Response } from 'express';
import { purchaseService } from './purchase.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { parsePagination } from '../../common/utils/pagination';
import {
  CreateVendorDto, UpdateVendorDto,
  CreatePurchaseOrderDto, ReceivePurchaseOrderDto, PurchaseOrderQueryDto,
} from './purchase.validator';

export class PurchaseController {
  async listVendors(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const companyId = req.query['companyId'] as string | undefined;
    const { data, total } = await purchaseService.listVendors(companyId, page, limit);
    sendPaginated(res, data, total, page, limit, 'Vendors retrieved');
  }

  async createVendor(req: Request, res: Response): Promise<void> {
    const vendor = await purchaseService.createVendor(req.body as CreateVendorDto);
    sendCreated(res, vendor, 'Vendor created successfully');
  }

  async updateVendor(req: Request, res: Response): Promise<void> {
    const vendor = await purchaseService.updateVendor(req.params['id']!, req.body as UpdateVendorDto);
    sendSuccess(res, vendor, 'Vendor updated');
  }

  async deleteVendor(req: Request, res: Response): Promise<void> {
    await purchaseService.deleteVendor(req.params['id']!);
    sendSuccess(res, null, MESSAGES.DELETED);
  }

  async listOrders(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as PurchaseOrderQueryDto;
    const { data, total } = await purchaseService.listOrders(query);
    sendPaginated(res, data, total, query.page, query.limit, 'Purchase orders retrieved');
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    const order = await purchaseService.getOrderById(req.params['id']!);
    sendSuccess(res, order);
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    const order = await purchaseService.createOrder(req.body as CreatePurchaseOrderDto);
    sendCreated(res, order, 'Purchase order created');
  }

  async confirmOrder(req: Request, res: Response): Promise<void> {
    const order = await purchaseService.confirmOrder(req.params['id']!, req.user!.id, req.user!.companyId);
    sendSuccess(res, order, MESSAGES.PURCHASE.CONFIRM_SUCCESS);
  }

  async receiveOrder(req: Request, res: Response): Promise<void> {
    const order = await purchaseService.receiveOrder(req.params['id']!, req.body as ReceivePurchaseOrderDto, req.user!.id, req.user!.companyId);
    sendSuccess(res, order, MESSAGES.PURCHASE.RECEIVE_SUCCESS);
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    await purchaseService.deleteOrder(req.params['id']!);
    sendSuccess(res, null, 'Purchase order deleted successfully');
  }
}

export const purchaseController = new PurchaseController();
