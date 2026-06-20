import { Router } from 'express';
import { Role } from '@prisma/client';
import { inventoryController } from './inventory.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { inventoryQuerySchema, stockAdjustmentSchema } from './inventory.validator';

const router = Router();
router.use(authenticate);

const inventoryRoles = [Role.ADMIN, Role.BUSINESS_OWNER, Role.INVENTORY_MANAGER, Role.MANUFACTURING_USER];

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Warehouse inventory management — per-warehouse stock levels
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List all inventory records (with per-warehouse stock levels)
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Inventory list with on_hand_qty, reserved_qty, free_to_use_qty
 */
router.get(
  '/',
  authorize(...inventoryRoles),
  validate(inventoryQuerySchema, 'query'),
  asyncHandler(inventoryController.list.bind(inventoryController)),
);

/**
 * @swagger
 * /inventory/{warehouseId}/{productId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get stock for a specific product in a warehouse
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stock levels
 */
router.get(
  '/:warehouseId/:productId',
  authorize(...inventoryRoles),
  asyncHandler(inventoryController.getStock.bind(inventoryController)),
);

/**
 * @swagger
 * /inventory/adjust:
 *   post:
 *     tags: [Inventory]
 *     summary: Manual stock adjustment (creates ledger entry + audit log)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, productId, newOnHandQty, reason]
 *             properties:
 *               warehouseId: { type: string, format: uuid }
 *               productId: { type: string, format: uuid }
 *               newOnHandQty: { type: number, minimum: 0 }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 */
router.post(
  '/adjust',
  authorize(Role.ADMIN, Role.INVENTORY_MANAGER),
  validate(stockAdjustmentSchema),
  asyncHandler(inventoryController.adjustStock.bind(inventoryController)),
);

export default router;
