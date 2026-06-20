import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

/**
 * Global API rate limiter: 100 requests per 15 minutes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests. Please try again later.', 429);
  },
});

/**
 * Login-specific rate limiter: 5 attempts per minute
 * Protects against brute-force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many login attempts. Please wait 1 minute before trying again.',
      429,
    );
  },
});

/**
 * Strict limiter for sensitive operations (password change, etc.)
 * 3 attempts per 5 minutes
 */
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Rate limit exceeded for this action.', 429);
  },
});
