import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to catch errors and pass to next().
 * Eliminates try/catch boilerplate in every controller.
 *
 * Usage: router.get('/path', asyncHandler(controller.method))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
