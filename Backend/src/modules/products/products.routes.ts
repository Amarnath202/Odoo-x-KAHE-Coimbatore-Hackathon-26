import { Router } from 'express';
import { Role } from '@prisma/client';
import { productsController } from './products.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management — heart of the ERP
 */

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products with filters and search
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or SKU
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: procurementType
 *         schema: { type: string, enum: [PURCHASE, MANUFACTURING] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get('/', validate(productQuerySchema, 'query'), asyncHandler(productsController.list.bind(productsController)));

router.get('/export', authorize(Role.ADMIN, Role.BUSINESS_OWNER), asyncHandler(productsController.exportExcel.bind(productsController)));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product details with unit, category, vendor
 *       404:
 *         description: Product not found
 */
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(productsController.getById.bind(productsController)));

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, sku, name]
 *             properties:
 *               companyId: { type: string, format: uuid }
 *               sku: { type: string, example: "TBL-001" }
 *               name: { type: string, example: "Wooden Table" }
 *               salesPrice: { type: number, example: 5000 }
 *               costPrice: { type: number, example: 3000 }
 *               procureOnDemand: { type: boolean, default: false }
 *               procurementType: { type: string, enum: [PURCHASE, MANUFACTURING] }
 *               vendorId: { type: string, format: uuid }
 *               bomId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Product created
 *       409:
 *         description: SKU already exists for this company
 */
router.post(
  '/',
  authorize(Role.ADMIN, Role.INVENTORY_MANAGER),
  validate(createProductSchema),
  asyncHandler(productsController.create.bind(productsController)),
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.INVENTORY_MANAGER),
  validate(idParamSchema, 'params'),
  validate(updateProductSchema),
  asyncHandler(productsController.update.bind(productsController)),
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product soft deleted
 */
router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate(idParamSchema, 'params'),
  asyncHandler(productsController.delete.bind(productsController)),
);

export default router;
