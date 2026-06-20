import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  newOnHandQty: z.coerce.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(1, 'Reason is required'),
});

export const inventoryQuerySchema = z.object({
  warehouseId: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  lowStock: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type StockAdjustmentDto = z.infer<typeof stockAdjustmentSchema>;
export type InventoryQueryDto = z.infer<typeof inventoryQuerySchema>;
