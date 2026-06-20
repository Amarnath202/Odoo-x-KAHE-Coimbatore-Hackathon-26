import { Router } from 'express';
import { Role } from '@prisma/client';
import { bomController } from './bom.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { createBomSchema, updateBomSchema } from './bom.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();
router.use(authenticate);

const mfgRoles = [Role.ADMIN, Role.BUSINESS_OWNER, Role.MANUFACTURING_USER, Role.INVENTORY_MANAGER];

/**
 * @swagger
 * tags:
 *   name: BOM
 *   description: Bill of Materials management
 */

/**
 * @swagger
 * /boms:
 *   get:
 *     tags: [BOM]
 *     summary: List all BOMs
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *         description: Filter by finished product
 *     responses:
 *       200:
 *         description: List of BOMs with components and operations
 */
router.get('/', authorize(...mfgRoles), asyncHandler(bomController.list.bind(bomController)));
router.get('/:id', authorize(...mfgRoles), validate(idParamSchema, 'params'), asyncHandler(bomController.getById.bind(bomController)));

/**
 * @swagger
 * /boms:
 *   post:
 *     tags: [BOM]
 *     summary: Create a Bill of Materials
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, productId, name, components]
 *             properties:
 *               companyId: { type: string, format: uuid }
 *               productId: { type: string, format: uuid, description: "Finished goods product" }
 *               name: { type: string, example: "Wooden Table BOM" }
 *               version: { type: string, example: "1.0" }
 *               components:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string, format: uuid }
 *                     quantity: { type: number }
 *                     unitId: { type: string, format: uuid }
 *               operations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string, example: "Assembly" }
 *                     sequence: { type: integer }
 *                     durationMinutes: { type: integer }
 *     responses:
 *       201:
 *         description: BOM created with components and operations
 */
router.post('/', authorize(...mfgRoles), validate(createBomSchema), asyncHandler(bomController.create.bind(bomController)));
router.put('/:id', authorize(...mfgRoles), validate(idParamSchema, 'params'), validate(updateBomSchema), asyncHandler(bomController.update.bind(bomController)));
router.delete('/:id', authorize(Role.ADMIN), validate(idParamSchema, 'params'), asyncHandler(bomController.delete.bind(bomController)));

export default router;
