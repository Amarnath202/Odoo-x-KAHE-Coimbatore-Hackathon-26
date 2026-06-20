import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../common/utils/response';

export class DashboardController {
  async getSummary(req: Request, res: Response): Promise<void> {
    const companyId = req.query['companyId'] as string | undefined;
    const data = await dashboardService.getSummary(companyId);
    sendSuccess(res, data, 'Dashboard summary retrieved');
  }

  async getSales(req: Request, res: Response): Promise<void> {
    const companyId = req.query['companyId'] as string | undefined;
    const data = await dashboardService.getSalesDashboard(companyId);
    sendSuccess(res, data, 'Sales dashboard retrieved');
  }

  async getPurchase(req: Request, res: Response): Promise<void> {
    const companyId = req.query['companyId'] as string | undefined;
    const data = await dashboardService.getPurchaseDashboard(companyId);
    sendSuccess(res, data, 'Purchase dashboard retrieved');
  }

  async getManufacturing(req: Request, res: Response): Promise<void> {
    const companyId = req.query['companyId'] as string | undefined;
    const data = await dashboardService.getManufacturingDashboard(companyId);
    sendSuccess(res, data, 'Manufacturing dashboard retrieved');
  }

  async getInventory(req: Request, res: Response): Promise<void> {
    const companyId = req.query['companyId'] as string | undefined;
    const data = await dashboardService.getInventoryDashboard(companyId);
    sendSuccess(res, data, 'Inventory dashboard retrieved');
  }
}

export const dashboardController = new DashboardController();
