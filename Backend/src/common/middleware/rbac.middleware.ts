import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { MESSAGES } from '../constants/messages';

/**
 * RBAC Middleware Factory.
 * Returns a middleware that checks if req.user.role is in the allowed roles array.
 *
 * Usage: router.get('/path', authenticate, authorize(Role.ADMIN, Role.BUSINESS_OWNER), controller)
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized(MESSAGES.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(MESSAGES.FORBIDDEN);
    }

    next();
  };
};

/**
 * Convenience: allow all authenticated users
 */
export const authorizeAll = (_req: Request, _res: Response, next: NextFunction): void => {
  next();
};
