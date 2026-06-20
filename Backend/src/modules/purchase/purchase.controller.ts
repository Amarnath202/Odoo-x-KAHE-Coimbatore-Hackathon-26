import { Request, Response } from 'express';
import { purchaseService } from './purchase.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { parsePagination } from '../../common/utils/pagination';
import {
  CreateVendorDto, UpdateVendorDto,
  CreatePurchaseOrderDto, ReceivePurchaseOrderDto, PurchaseOrderQueryDto,
} from './purchase.validator';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

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

  async exportExcel(req: Request, res: Response): Promise<void> {
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const companyId = req.user?.companyId;

    const orders = await purchaseService.getExportData(companyId, month, year);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Purchase Orders');

    worksheet.columns = [
      { header: 'Purchase ID', key: 'id', width: 36 },
      { header: 'Supplier Name', key: 'supplierName', width: 25 },
      { header: 'Product Name', key: 'productName', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Cost', key: 'unitCost', width: 15 },
      { header: 'Total Cost', key: 'totalCost', width: 15 },
      { header: 'Purchase Date', key: 'purchaseDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const order of orders) {
      for (const item of order.items) {
        worksheet.addRow({
          id: order.id,
          supplierName: order.vendor.name,
          productName: item.product.name,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitPrice),
          totalCost: Number(item.quantity) * Number(item.unitPrice),
          purchaseDate: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm'),
          status: order.status,
        });
      }
    }

    let fileName = 'purchases.xlsx';
    if (month && year) {
      fileName = `purchases_${dayjs().month(month - 1).format('MMMM').toLowerCase()}_${year}.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  }
}

export const purchaseController = new PurchaseController();
