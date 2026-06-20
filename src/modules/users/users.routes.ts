import { Router } from 'express';
import { Role } from '@prisma/client';
import { usersController } from './users.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { createUserSchema, updateUserSchema, userQuerySchema } from './users.validator';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();

// All user routes require authentication + ADMIN role
router.use(authenticate, authorize(Role.ADMIN, Role.BUSINESS_OWNER));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (ADMIN only)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (with filters)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, SALES_USER, PURCHASE_USER, MANUFACTURING_USER, INVENTORY_MANAGER, BUSINESS_OWNER] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get('/', validate(userQuerySchema, 'query'), asyncHandler(usersController.list.bind(usersController)));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(usersController.getById.bind(usersController)));

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role, companyId]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [ADMIN, SALES_USER, PURCHASE_USER, MANUFACTURING_USER, INVENTORY_MANAGER, BUSINESS_OWNER] }
 *               companyId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 */
router.post('/', validate(createUserSchema), asyncHandler(usersController.create.bind(usersController)));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user (name, role, isActive)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  asyncHandler(usersController.update.bind(usersController)),
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User soft deleted
 */
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(usersController.delete.bind(usersController)),
);

export default router;
