import { Request, Response } from 'express';
import { categoriesService } from './categories.service';
import { sendSuccess, sendCreated } from '../../common/utils/response';

export class CategoriesController {
  async list(req: Request, res: Response): Promise<void> {
    const companyId = req.query['companyId'] as string | undefined;
    const categories = await categoriesService.list(companyId);
    sendSuccess(res, categories, 'Categories retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const cat = await categoriesService.getById(req.params['id']!);
    sendSuccess(res, cat);
  }

  async create(req: Request, res: Response): Promise<void> {
    const cat = await categoriesService.create(req.body);
    sendCreated(res, cat, 'Category created successfully');
  }

  async update(req: Request, res: Response): Promise<void> {
    const cat = await categoriesService.update(req.params['id']!, req.body);
    sendSuccess(res, cat, 'Category updated successfully');
  }

  async delete(req: Request, res: Response): Promise<void> {
    await categoriesService.delete(req.params['id']!);
    sendSuccess(res, null, 'Category deleted successfully');
  }
}

export const categoriesController = new CategoriesController();
