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
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

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

  async exportExcel(req: Request, res: Response): Promise<void> {
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const companyId = req.user?.companyId;

    const orders = await salesService.getExportData(companyId, month, year);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Orders');

    worksheet.columns = [
      { header: 'Sales ID', key: 'id', width: 36 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Product Name', key: 'productName', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Price', key: 'unitPrice', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Sales Date', key: 'salesDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const order of orders) {
      for (const item of order.items) {
        worksheet.addRow({
          id: order.id,
          customerName: order.customer.name,
          productName: item.product.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalAmount: Number(item.quantity) * Number(item.unitPrice),
          salesDate: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm'),
          status: order.status,
        });
      }
    }

    let fileName = 'sales.xlsx';
    if (month && year) {
      fileName = `sales_${dayjs().month(month - 1).format('MMMM').toLowerCase()}_${year}.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  }
}

export const salesController = new SalesController();
