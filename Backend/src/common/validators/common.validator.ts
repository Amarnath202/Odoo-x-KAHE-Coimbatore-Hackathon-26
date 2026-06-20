import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().min(1, { message: 'ID is required' });

// Pagination query params
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Common search query
export const searchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ID param
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Company ID param
export const companyIdParamSchema = z.object({
  companyId: uuidSchema,
});

// Date range query
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
