import { Router } from 'express';
import { Role } from '@prisma/client';
import { procurementController } from './procurement.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Procurement
 *   description: Procurement automation logs and manual trigger
 */

/**
 * @swagger
 * /procurement/logs:
 *   get:
 *     tags: [Procurement]
 *     summary: List procurement automation logs
 *     description: Shows all auto-generated POs and MOs triggered by the procurement engine
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Procurement log entries
 */
router.get(
  '/logs',
  authorize(Role.ADMIN, Role.BUSINESS_OWNER, Role.PURCHASE_USER, Role.MANUFACTURING_USER),
  asyncHandler(procurementController.getLogs.bind(procurementController)),
);

/**
 * @swagger
 * /procurement/trigger:
 *   post:
 *     tags: [Procurement]
 *     summary: Manually trigger procurement automation for a product shortage
 *     description: Useful for demo and testing — simulates the auto-procurement that fires on Sales Confirm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, shortageQty]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               shortageQty:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Procurement triggered — PO or MO auto-created
 */
router.post(
  '/trigger',
  authorize(Role.ADMIN, Role.INVENTORY_MANAGER),
  asyncHandler(procurementController.manualTrigger.bind(procurementController)),
);

export default router;
