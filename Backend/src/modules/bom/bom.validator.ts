import { z } from 'zod';

const BOM_MIN_COMPONENTS = 'BoM must have at least one component';

export const createBomSchema = z.object({
  companyId: z.string().uuid(),
  productId: z.string().uuid('Finished goods product ID required'),
  name: z.string().min(2),
  version: z.string().default('1.0'),
  components: z
    .array(
      z.object({
        productId: z.string().uuid('Component product ID required'),
        quantity: z.coerce.number().positive('Quantity must be positive'),
        unitId: z.string().uuid().optional(),
      }),
    )
    .min(1, BOM_MIN_COMPONENTS),
  operations: z
    .array(
      z.object({
        name: z.string().min(1),
        sequence: z.coerce.number().int().positive(),
        durationMinutes: z.coerce.number().int().min(0).default(0),
      }),
    )
    .optional()
    .default([]),
});

export const updateBomSchema = z.object({
  name: z.string().min(2).optional(),
  version: z.string().optional(),
  components: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().positive(),
        unitId: z.string().uuid().optional(),
      }),
    )
    .min(1)
    .optional(),
  operations: z
    .array(
      z.object({
        name: z.string().min(1),
        sequence: z.coerce.number().int().positive(),
        durationMinutes: z.coerce.number().int().min(0).default(0),
      }),
    )
    .optional(),
});

export type CreateBomDto = z.infer<typeof createBomSchema>;
export type UpdateBomDto = z.infer<typeof updateBomSchema>;
