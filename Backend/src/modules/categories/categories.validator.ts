import { z } from 'zod';

export const createCategorySchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
