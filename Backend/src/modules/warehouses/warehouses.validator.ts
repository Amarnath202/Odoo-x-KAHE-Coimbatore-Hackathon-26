import { z } from 'zod';

export const createWarehouseSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  location: z.string().optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial().omit({ companyId: true });

export type CreateWarehouseDto = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseDto = z.infer<typeof updateWarehouseSchema>;
