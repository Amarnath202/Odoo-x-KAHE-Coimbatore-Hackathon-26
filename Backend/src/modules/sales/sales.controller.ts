import { Request, Response } from 'express';
import { salesService } from './sales.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { parsePagination } from '../../common/utils/pagination';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateSalesOrderDto,
  ConfirmSalesOrderDto,
  DeliverSalesOrderDto,
  SalesOrderQueryDto,
} from './sales.validator';

export class SalesController {
  // ─── Customers ─────────────────────────────────────────────

  async listCustomers(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const companyId = req.query['companyId'] as string | undefined;
    const { data, total } = await salesService.listCustomers(companyId, page, limit);
    sendPaginated(res, data, total, page, limit, 'Customers retrieved');
  }

  async createCustomer(req: Request, res: Response): Promise<void> {
    const customer = await salesService.createCustomer(req.body as CreateCustomerDto);
    sendCreated(res, customer, 'Customer created successfully');
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
    const customer = await salesService.updateCustomer(req.params['id']!, req.body as UpdateCustomerDto);
    sendSuccess(res, customer, 'Customer updated successfully');
  }

  async deleteCustomer(req: Request, res: Response): Promise<void> {
    await salesService.deleteCustomer(req.params['id']!);
    sendSuccess(res, null, MESSAGES.DELETED);
  }

  // ─── Sales Orders ───────────────────────────────────────────

  async listOrders(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as SalesOrderQueryDto;
    const { data, total } = await salesService.listOrders(query);
    sendPaginated(res, data, total, query.page, query.limit, 'Sales orders retrieved');
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    const order = await salesService.getOrderById(req.params['id']!);
    sendSuccess(res, order);
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    const order = await salesService.createOrder(req.body as CreateSalesOrderDto);
    sendCreated(res, order, 'Sales order created successfully');
  }

  async confirmOrder(req: Request, res: Response): Promise<void> {
    const order = await salesService.confirmOrder(
      req.params['id']!,
      req.body as ConfirmSalesOrderDto,
      req.user!.id,
      req.user!.companyId,
    );
    sendSuccess(res, order, MESSAGES.SALES.CONFIRM_SUCCESS);
  }

  async deliverOrder(req: Request, res: Response): Promise<void> {
    const order = await salesService.deliverOrder(
      req.params['id']!,
      req.body as DeliverSalesOrderDto,
      req.user!.id,
      req.user!.companyId,
    );
    sendSuccess(res, order, MESSAGES.SALES.DELIVER_SUCCESS);
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    const warehouseId = req.body.warehouseId as string;
    const order = await salesService.cancelOrder(
      req.params['id']!,
      req.user!.id,
      req.user!.companyId,
      warehouseId,
    );
    sendSuccess(res, order, MESSAGES.SALES.CANCELLED);
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    await salesService.deleteOrder(req.params['id']!);
    sendSuccess(res, null, 'Sales order deleted successfully');
  }
}

export const salesController = new SalesController();
