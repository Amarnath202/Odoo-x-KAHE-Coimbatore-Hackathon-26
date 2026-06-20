import { Router } from 'express';
import { Role } from '@prisma/client';
import { companiesController } from './companies.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { createCompanySchema, updateCompanySchema } from './companies.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Multi-company management
 */

/**
 * @swagger
 * /companies:
 *   get:
 *     tags: [Companies]
 *     summary: List all companies
 *     responses:
 *       200:
 *         description: List of companies
 */
router.get(
  '/',
  authorize(Role.ADMIN, Role.BUSINESS_OWNER),
  asyncHandler(companiesController.list.bind(companiesController)),
);

router.get(
  '/:id',
  authorize(Role.ADMIN, Role.BUSINESS_OWNER),
  validate(idParamSchema, 'params'),
  asyncHandler(companiesController.getById.bind(companiesController)),
);

/**
 * @swagger
 * /companies:
 *   post:
 *     tags: [Companies]
 *     summary: Create a company
 *     responses:
 *       201:
 *         description: Company created
 */
router.post(
  '/',
  authorize(Role.ADMIN),
  validate(createCompanySchema),
  asyncHandler(companiesController.create.bind(companiesController)),
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(idParamSchema, 'params'),
  validate(updateCompanySchema),
  asyncHandler(companiesController.update.bind(companiesController)),
);

export default router;
