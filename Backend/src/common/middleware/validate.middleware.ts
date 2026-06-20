import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Zod request validation middleware factory.
 * Validates the specified part of the request against a Zod schema.
 *
 * Usage: router.post('/', validate(createSchema), controller)
 * Usage: router.get('/:id', validate(idSchema, 'params'), controller)
 */
export const validate = (schema: AnyZodObject, target: ValidateTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);

      // Assign parsed (coerced/defaulted) values back to request
      req[target] = parsed;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        sendError(res, 'Validation failed', 400, errors);
        return;
      }
      next(err);
    }
  };
};
