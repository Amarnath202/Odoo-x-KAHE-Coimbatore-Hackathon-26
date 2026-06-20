import { Router } from 'express';
import { authController } from './auth.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { loginLimiter, strictLimiter } from '../../common/middleware/rateLimiter.middleware';
import { loginSchema, changePasswordSchema } from './auth.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and token management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@shivfurniture.com
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful — refresh token set in HttpOnly cookie
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController)),
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout.bind(authController)),
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Get new access token using refresh token (from cookie)
 *     security: []
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  '/refresh',
  asyncHandler(authController.refresh.bind(authController)),
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change own password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed — all sessions invalidated
 */
router.post(
  '/change-password',
  authenticate,
  strictLimiter,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController)),
);

export default router;
