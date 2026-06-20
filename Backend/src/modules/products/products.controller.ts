import { Request, Response } from 'express';
import { productsService } from './products.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './products.validator';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

export class ProductsController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ProductQueryDto;
    const { data, total } = await productsService.list(query);
    sendPaginated(res, data, total, query.page, query.limit, 'Products retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const product = await productsService.getById(req.params['id']!);
    sendSuccess(res, product);
  }

  async create(req: Request, res: Response): Promise<void> {
    const product = await productsService.create(req.body as CreateProductDto);
    sendCreated(res, product, MESSAGES.PRODUCTS.CREATED);
  }

  async update(req: Request, res: Response): Promise<void> {
    const product = await productsService.update(req.params['id']!, req.body as UpdateProductDto);
    sendSuccess(res, product, MESSAGES.UPDATED);
  }

  async delete(req: Request, res: Response): Promise<void> {
    await productsService.delete(req.params['id']!);
    sendSuccess(res, null, MESSAGES.DELETED);
  }

  async exportExcel(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.companyId;

    const products = await productsService.getExportData(companyId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Product Code', key: 'sku', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Stock Quantity', key: 'stock', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Image URL', key: 'image', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const p of products) {
      const totalStock = p.inventory?.reduce((sum, inv) => sum + Number(inv.onHandQty), 0) || 0;
      worksheet.addRow({
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        price: Number(p.salesPrice),
        stock: totalStock,
        status: p.deletedAt ? 'Deleted' : 'Active',
        image: (p as any).imageUrl || 'N/A', // Assuming imageUrl might be added later
      });
    }

    const fileName = `products_${dayjs().format('YYYY_MM_DD')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  }
}

export const productsController = new ProductsController();
