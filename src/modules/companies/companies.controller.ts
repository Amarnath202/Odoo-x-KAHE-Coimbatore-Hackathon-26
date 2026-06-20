import { Request, Response } from 'express';
import { companiesService } from './companies.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { parsePagination } from '../../common/utils/pagination';

export class CompaniesController {
  async list(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { data, total } = await companiesService.list(page, limit);
    sendPaginated(res, data, total, page, limit, 'Companies retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const company = await companiesService.getById(req.params['id']!);
    sendSuccess(res, company);
  }

  async create(req: Request, res: Response): Promise<void> {
    const company = await companiesService.create(req.body);
    sendCreated(res, company, 'Company created successfully');
  }

  async update(req: Request, res: Response): Promise<void> {
    const company = await companiesService.update(req.params['id']!, req.body);
    sendSuccess(res, company, 'Company updated successfully');
  }
}

export const companiesController = new CompaniesController();
