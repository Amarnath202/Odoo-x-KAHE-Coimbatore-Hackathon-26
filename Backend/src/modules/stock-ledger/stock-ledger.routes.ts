import { Router } from 'express';
import { Role } from '@prisma/client';
import { stockLedgerController } from './stock-ledger.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

const ledgerRoles = [Role.ADMIN, Role.BUSINESS_OWNER, Role.INVENTORY_MANAGER];

/**
 * @swagger
 * tags:
 *   name: StockLedger
 *   description: Immutable inventory movement history
 */

/**
 * @swagger
 * /stock-ledger:
 *   get:
 *     tags: [StockLedger]
 *     summary: List all stock ledger entries (immutable movement history)
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: movementType
 *         schema: { type: string, enum: [PURCHASE_RECEIPT, SALES_DELIVERY, MANUFACTURING_CONSUMPTION, MANUFACTURING_PRODUCTION, STOCK_ADJUSTMENT] }
 *       - in: query
 *         name: referenceType
 *         schema: { type: string }
 *       - in: query
 *         name: referenceId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated stock ledger entries with before/after quantities
 */
router.get('/', authorize(...ledgerRoles), asyncHandler(stockLedgerController.list.bind(stockLedgerController)));

/**
 * @swagger
 * /stock-ledger/product/{productId}:
 *   get:
 *     tags: [StockLedger]
 *     summary: Get all stock movements for a specific product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product movement history
 */
router.get('/product/:productId', authorize(...ledgerRoles), asyncHandler(stockLedgerController.getByProduct.bind(stockLedgerController)));

export default router;
