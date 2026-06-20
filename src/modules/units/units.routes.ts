import { Router } from 'express';
import { Role } from '@prisma/client';
import { unitsController } from './units.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { createUnitSchema, updateUnitSchema } from './units.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Units
 *   description: Units of Measurement (PCS, KG, METER, BOX)
 */

/**
 * @swagger
 * /units:
 *   get:
 *     tags: [Units]
 *     summary: List all units of measurement
 *     responses:
 *       200:
 *         description: List of units
 */
router.get('/', asyncHandler(unitsController.list.bind(unitsController)));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(unitsController.getById.bind(unitsController)));

/**
 * @swagger
 * /units:
 *   post:
 *     tags: [Units]
 *     summary: Create a unit (ADMIN only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, symbol]
 *             properties:
 *               name: { type: string, example: "Pieces" }
 *               symbol: { type: string, example: "PCS" }
 *     responses:
 *       201:
 *         description: Unit created
 */
router.post('/', authorize(Role.ADMIN), validate(createUnitSchema), asyncHandler(unitsController.create.bind(unitsController)));
router.put('/:id', authorize(Role.ADMIN), validate(idParamSchema, 'params'), validate(updateUnitSchema), asyncHandler(unitsController.update.bind(unitsController)));
router.delete('/:id', authorize(Role.ADMIN), validate(idParamSchema, 'params'), asyncHandler(unitsController.delete.bind(unitsController)));

export default router;
