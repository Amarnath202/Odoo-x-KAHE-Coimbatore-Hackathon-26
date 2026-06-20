import { Router } from 'express';
import { Role } from '@prisma/client';
import { salesController } from './sales.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createSalesOrderSchema,
  confirmSalesOrderSchema,
  deliverSalesOrderSchema,
  salesOrderQuerySchema,
} from './sales.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();
router.use(authenticate);

const salesRoles = [Role.ADMIN, Role.BUSINESS_OWNER, Role.SALES_USER, Role.INVENTORY_MANAGER];
const deliverRoles = [Role.ADMIN, Role.BUSINESS_OWNER, Role.SALES_USER, Role.INVENTORY_MANAGER];

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Customers and Sales Order management
 */

// ─── Customer Routes ────────────────────────────────────────

/**
 * @swagger
 * /customers:
 *   get:
 *     tags: [Sales]
 *     summary: List all customers
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Customer list
 */
router.get('/customers', authorize(...salesRoles), asyncHandler(salesController.listCustomers.bind(salesController)));

/**
 * @swagger
 * /customers:
 *   post:
 *     tags: [Sales]
 *     summary: Create a customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, name]
 *             properties:
 *               companyId: { type: string, format: uuid }
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Customer created
 */
router.post('/customers', authorize(...salesRoles), validate(createCustomerSchema), asyncHandler(salesController.createCustomer.bind(salesController)));
router.put('/customers/:id', authorize(...salesRoles), validate(idParamSchema, 'params'), validate(updateCustomerSchema), asyncHandler(salesController.updateCustomer.bind(salesController)));
router.delete('/customers/:id', authorize(Role.ADMIN, Role.BUSINESS_OWNER), validate(idParamSchema, 'params'), asyncHandler(salesController.deleteCustomer.bind(salesController)));

// ─── Sales Order Routes ──────────────────────────────────────

/**
 * @swagger
 * /sales-orders:
 *   get:
 *     tags: [Sales]
 *     summary: List sales orders with filters
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, CONFIRMED, PARTIALLY_DELIVERED, FULLY_DELIVERED, CANCELLED] }
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated sales order list
 */
router.get('/sales-orders', authorize(...salesRoles), validate(salesOrderQuerySchema, 'query'), asyncHandler(salesController.listOrders.bind(salesController)));
router.get('/sales-orders/:id', authorize(...salesRoles), validate(idParamSchema, 'params'), asyncHandler(salesController.getOrderById.bind(salesController)));

/**
 * @swagger
 * /sales-orders:
 *   post:
 *     tags: [Sales]
 *     summary: Create a new sales order (DRAFT)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, customerId, items]
 *             properties:
 *               companyId: { type: string, format: uuid }
 *               customerId: { type: string, format: uuid }
 *               notes: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity, unitPrice]
 *                   properties:
 *                     productId: { type: string, format: uuid }
 *                     quantity: { type: number, minimum: 1 }
 *                     unitPrice: { type: number, minimum: 0 }
 *     responses:
 *       201:
 *         description: Sales order created in DRAFT state
 */
router.post('/sales-orders', authorize(...salesRoles), validate(createSalesOrderSchema), asyncHandler(salesController.createOrder.bind(salesController)));

/**
 * @swagger
 * /sales-orders/{id}/confirm:
 *   post:
 *     tags: [Sales]
 *     summary: Confirm sales order — reserves inventory and triggers procurement if shortage
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId]
 *             properties:
 *               warehouseId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order confirmed, stock reserved
 */
router.post('/sales-orders/:id/confirm', authorize(...salesRoles), validate(idParamSchema, 'params'), validate(confirmSalesOrderSchema), asyncHandler(salesController.confirmOrder.bind(salesController)));

/**
 * @swagger
 * /sales-orders/{id}/deliver:
 *   post:
 *     tags: [Sales]
 *     summary: Record delivery — deducts stock, creates ledger entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Delivery recorded, inventory updated
 */
router.post('/sales-orders/:id/deliver', authorize(...deliverRoles), validate(idParamSchema, 'params'), validate(deliverSalesOrderSchema), asyncHandler(salesController.deliverOrder.bind(salesController)));

/**
 * @swagger
 * /sales-orders/{id}/cancel:
 *   post:
 *     tags: [Sales]
 *     summary: Cancel a sales order — releases inventory reservation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order cancelled, reservations released
 */
router.post('/sales-orders/:id/cancel', authorize(...salesRoles), validate(idParamSchema, 'params'), asyncHandler(salesController.cancelOrder.bind(salesController)));

/**
 * @swagger
 * /sales-orders/{id}:
 *   delete:
 *     tags: [Sales]
 *     summary: Delete a sales order
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order deleted
 */
router.delete('/sales-orders/:id', authorize(Role.ADMIN, Role.BUSINESS_OWNER), validate(idParamSchema, 'params'), asyncHandler(salesController.deleteOrder.bind(salesController)));

export default router;
