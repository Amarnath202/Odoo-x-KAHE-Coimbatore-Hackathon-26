import { z } from 'zod';

// Customer schemas
export const createCustomerSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().omit({ companyId: true });

// Sales Order schemas
export const createSalesOrderSchema = z.object({
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().positive('Quantity must be positive'),
        unitPrice: z.coerce.number().min(0),
      }),
    )
    .min(1, 'At least one item is required'),
});

export const confirmSalesOrderSchema = z.object({
  warehouseId: z.string().uuid('Warehouse ID is required for stock reservation'),
});

export const deliverSalesOrderSchema = z.object({
  warehouseId: z.string().uuid(),
  items: z
    .array(
      z.object({
        salesOrderItemId: z.string().uuid(),
        deliveredQty: z.coerce.number().positive(),
      }),
    )
    .min(1, 'At least one delivery item required'),
});

export const salesOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  companyId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'CANCELLED']).optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type CreateSalesOrderDto = z.infer<typeof createSalesOrderSchema>;
export type ConfirmSalesOrderDto = z.infer<typeof confirmSalesOrderSchema>;
export type DeliverSalesOrderDto = z.infer<typeof deliverSalesOrderSchema>;
export type SalesOrderQueryDto = z.infer<typeof salesOrderQuerySchema>;
