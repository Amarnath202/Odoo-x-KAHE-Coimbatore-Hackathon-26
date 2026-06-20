import { Router } from 'express';
import { Role } from '@prisma/client';
import { auditLogsController } from './audit-logs.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: Full audit trail of all ERP operations
 */

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     tags: [AuditLogs]
 *     summary: List audit log entries
 *     description: Full traceability of all ERP actions — price changes, confirmations, deliveries, completions
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *         description: "Filter by module: SALES, PURCHASE, MANUFACTURING, INVENTORY"
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [CREATE, UPDATE, DELETE, CONFIRM, DELIVER, RECEIVE, COMPLETE, CANCEL, LOGIN, LOGOUT, ADJUST] }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: entityId
 *         schema: { type: string, format: uuid }
 *         description: Filter by specific order/product/entity ID
 *     responses:
 *       200:
 *         description: Paginated audit log entries with old/new value diffs
 */
router.get(
  '/',
  authorize(Role.ADMIN, Role.BUSINESS_OWNER),
  asyncHandler(auditLogsController.list.bind(auditLogsController)),
);

export default router;
