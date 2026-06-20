import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { AppError } from '../utils/AppError';
import { MESSAGES } from '../constants/messages';

/**
 * JWT Authentication Middleware.
 * Verifies the Bearer token from the Authorization header
 * and attaches the decoded payload to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw AppError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized(MESSAGES.AUTH.TOKEN_EXPIRED);
    }
    throw AppError.unauthorized(MESSAGES.AUTH.TOKEN_INVALID);
  }
};
