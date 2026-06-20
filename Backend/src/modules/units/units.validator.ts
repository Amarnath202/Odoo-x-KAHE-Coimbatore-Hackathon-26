import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(10),
});

export const updateUnitSchema = createUnitSchema.partial();

export type CreateUnitDto = z.infer<typeof createUnitSchema>;
export type UpdateUnitDto = z.infer<typeof updateUnitSchema>;
