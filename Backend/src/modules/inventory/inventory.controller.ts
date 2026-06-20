import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { InventoryQueryDto, StockAdjustmentDto } from './inventory.validator';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

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

  async exportExcel(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.companyId;

    const inventories = await inventoryService.getExportData(companyId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    worksheet.columns = [
      { header: 'Product Name', key: 'productName', width: 30 },
      { header: 'Current Stock', key: 'onHandQty', width: 15 },
      { header: 'Minimum Stock Level', key: 'minStock', width: 20 },
      { header: 'Reorder Status', key: 'reorderStatus', width: 15 },
      { header: 'Last Updated Date', key: 'updatedAt', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const inv of inventories) {
      // Logic for Min Stock/Reorder can be simulated if not in schema.
      const isReorderNeeded = Number(inv.onHandQty) <= 0; // Or other threshold
      worksheet.addRow({
        productName: inv.product.name,
        onHandQty: Number(inv.onHandQty),
        minStock: '0', // Assuming 0 if not stored
        reorderStatus: isReorderNeeded ? 'Needed' : 'OK',
        updatedAt: dayjs(inv.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    const fileName = `inventory_${dayjs().format('YYYY_MM_DD')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  }
}

export const inventoryController = new InventoryController();
