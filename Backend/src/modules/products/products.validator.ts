import { z } from 'zod';
import { ProcurementType } from '@prisma/client';

export const createProductSchema = z.object({
  companyId: z.string().min(1),
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  unitId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  salesPrice: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  procureOnDemand: z.boolean().default(false),
  procurementType: z.nativeEnum(ProcurementType).default(ProcurementType.PURCHASE),
  vendorId: z.string().min(1).optional(),
  bomId: z.string().min(1).optional(),
});

export const updateProductSchema = createProductSchema.partial().omit({ companyId: true });

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  companyId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  search: z.string().optional(),
  procurementType: z.nativeEnum(ProcurementType).optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductQueryDto = z.infer<typeof productQuerySchema>;
