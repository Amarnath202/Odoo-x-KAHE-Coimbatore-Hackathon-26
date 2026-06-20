import { Router } from 'express';
import { Role } from '@prisma/client';
import { categoriesController } from './categories.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { createCategorySchema, updateCategorySchema } from './categories.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category management
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all product categories
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', asyncHandler(categoriesController.list.bind(categoriesController)));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(categoriesController.getById.bind(categoriesController)));
router.post('/', authorize(Role.ADMIN, Role.INVENTORY_MANAGER), validate(createCategorySchema), asyncHandler(categoriesController.create.bind(categoriesController)));
router.put('/:id', authorize(Role.ADMIN, Role.INVENTORY_MANAGER), validate(idParamSchema, 'params'), validate(updateCategorySchema), asyncHandler(categoriesController.update.bind(categoriesController)));
router.delete('/:id', authorize(Role.ADMIN), validate(idParamSchema, 'params'), asyncHandler(categoriesController.delete.bind(categoriesController)));

export default router;
