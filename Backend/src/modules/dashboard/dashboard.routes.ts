import { Router } from 'express';
import { Role } from '@prisma/client';
import { dashboardController } from './dashboard.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: ERP summary metrics and KPI dashboards
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Overall ERP summary (products, inventory, customers, vendors, recent activity)
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: ERP summary metrics
 */
router.get('/summary', authorize(Role.ADMIN, Role.BUSINESS_OWNER), asyncHandler(dashboardController.getSummary.bind(dashboardController)));

/**
 * @swagger
 * /dashboard/sales:
 *   get:
 *     tags: [Dashboard]
 *     summary: Sales dashboard (orders by status, revenue, pending deliveries)
 *     responses:
 *       200:
 *         description: Sales KPIs
 */
router.get('/sales', authorize(Role.ADMIN, Role.BUSINESS_OWNER, Role.SALES_USER), asyncHandler(dashboardController.getSales.bind(dashboardController)));

/**
 * @swagger
 * /dashboard/purchase:
 *   get:
 *     tags: [Dashboard]
 *     summary: Purchase dashboard (orders by status, spend, pending receipts)
 *     responses:
 *       200:
 *         description: Purchase KPIs
 */
router.get('/purchase', authorize(Role.ADMIN, Role.BUSINESS_OWNER, Role.PURCHASE_USER), asyncHandler(dashboardController.getPurchase.bind(dashboardController)));

/**
 * @swagger
 * /dashboard/manufacturing:
 *   get:
 *     tags: [Dashboard]
 *     summary: Manufacturing dashboard (active production, completed orders)
 *     responses:
 *       200:
 *         description: Manufacturing KPIs
 */
router.get('/manufacturing', authorize(Role.ADMIN, Role.BUSINESS_OWNER, Role.MANUFACTURING_USER), asyncHandler(dashboardController.getManufacturing.bind(dashboardController)));

/**
 * @swagger
 * /dashboard/inventory:
 *   get:
 *     tags: [Dashboard]
 *     summary: Inventory dashboard (low stock, zero stock, recent movements)
 *     responses:
 *       200:
 *         description: Inventory KPIs with low stock alerts
 */
router.get('/inventory', authorize(Role.ADMIN, Role.BUSINESS_OWNER, Role.INVENTORY_MANAGER), asyncHandler(dashboardController.getInventory.bind(dashboardController)));

export default router;
