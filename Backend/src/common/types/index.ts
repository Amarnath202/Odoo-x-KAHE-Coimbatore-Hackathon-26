import { Role, LedgerMovementType, AuditAction } from '@prisma/client';

// JWT Payload stored in the access token
export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  companyId: string;
  name: string;
}

// Standard paginated response wrapper
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query options for paginated repository calls
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Inventory adjustment payload (used internally by InventoryService)
export interface InventoryAdjustment {
  warehouseId: string;
  productId: string;
  delta: number;             // positive = increase, negative = decrease
  field: 'onHandQty' | 'reservedQty';
  movementType: LedgerMovementType;
  referenceType: string;
  referenceId: string;
  userId?: string;
  tx?: unknown;              // Prisma transaction client
}

// Audit log creation payload
export interface AuditLogPayload {
  companyId: string;
  userId?: string;
  module: string;
  action: AuditAction;
  entityId?: string;
  oldValue?: object | null;
  newValue?: object | null;
  ipAddress?: string;
}

// Stock ledger creation payload
export interface StockLedgerPayload {
  warehouseId: string;
  productId: string;
  movementType: LedgerMovementType;
  qtyBefore: number;
  qtyChanged: number;
  qtyAfter: number;
  referenceType: string;
  referenceId: string;
  createdBy?: string;
}
