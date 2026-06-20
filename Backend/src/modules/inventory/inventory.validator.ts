import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  productId: z.string().uuid('Invalid product ID'),
  newOnHandQty: z.coerce.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(1, 'Reason is required'),
});

export const inventoryQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  lowStock: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type StockAdjustmentDto = z.infer<typeof stockAdjustmentSchema>;
export type InventoryQueryDto = z.infer<typeof inventoryQuerySchema>;
