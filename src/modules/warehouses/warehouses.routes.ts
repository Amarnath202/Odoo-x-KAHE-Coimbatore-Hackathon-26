import { Router } from 'express';
import { Role } from '@prisma/client';
import { warehousesController } from './warehouses.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { createWarehouseSchema, updateWarehouseSchema } from './warehouses.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse management
 */

/**
 * @swagger
 * /warehouses:
 *   get:
 *     tags: [Warehouses]
 *     summary: List warehouses
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of warehouses
 */
router.get(
  '/',
  authorize(Role.ADMIN, Role.BUSINESS_OWNER, Role.INVENTORY_MANAGER, Role.MANUFACTURING_USER),
  asyncHandler(warehousesController.list.bind(warehousesController)),
);

router.get(
  '/:id',
  authorize(Role.ADMIN, Role.BUSINESS_OWNER, Role.INVENTORY_MANAGER, Role.MANUFACTURING_USER),
  validate(idParamSchema, 'params'),
  asyncHandler(warehousesController.getById.bind(warehousesController)),
);

/**
 * @swagger
 * /warehouses:
 *   post:
 *     tags: [Warehouses]
 *     summary: Create a warehouse
 *     responses:
 *       201:
 *         description: Warehouse created
 */
router.post(
  '/',
  authorize(Role.ADMIN),
  validate(createWarehouseSchema),
  asyncHandler(warehousesController.create.bind(warehousesController)),
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(idParamSchema, 'params'),
  validate(updateWarehouseSchema),
  asyncHandler(warehousesController.update.bind(warehousesController)),
);

export default router;
