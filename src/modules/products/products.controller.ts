import { Request, Response } from 'express';
import { productsService } from './products.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './products.validator';

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
}

export const productsController = new ProductsController();
