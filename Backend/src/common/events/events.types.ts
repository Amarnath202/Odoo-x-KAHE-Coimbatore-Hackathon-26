// ============================================================
// ERP EVENT TYPE DEFINITIONS
// Event-driven ready architecture — swap emitter for MQ later
// ============================================================

export const ERP_EVENTS = {
  SALES_CONFIRMED: 'sales.confirmed',
  SALES_DELIVERED: 'sales.delivered',
  SALES_CANCELLED: 'sales.cancelled',
  PURCHASE_CONFIRMED: 'purchase.confirmed',
  PURCHASE_RECEIVED: 'purchase.received',
  MANUFACTURING_CONFIRMED: 'manufacturing.confirmed',
  MANUFACTURING_STARTED: 'manufacturing.started',
  MANUFACTURING_COMPLETED: 'manufacturing.completed',
  PROCUREMENT_TRIGGERED: 'procurement.triggered',
  INVENTORY_ADJUSTED: 'inventory.adjusted',
  STOCK_LOW: 'stock.low',
} as const;

export type ERPEventName = (typeof ERP_EVENTS)[keyof typeof ERP_EVENTS];

// Event payload types

export interface SalesConfirmedEvent {
  salesOrderId: string;
  companyId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; warehouseId: string }>;
  triggeredBy: string;
}

export interface SalesDeliveredEvent {
  salesOrderId: string;
  companyId: string;
  items: Array<{ productId: string; deliveredQty: number; warehouseId: string }>;
  triggeredBy: string;
}

export interface PurchaseReceivedEvent {
  purchaseOrderId: string;
  companyId: string;
  vendorId: string;
  items: Array<{ productId: string; receivedQty: number; warehouseId: string }>;
  triggeredBy: string;
}

export interface ManufacturingCompletedEvent {
  manufacturingOrderId: string;
  companyId: string;
  productId: string;
  quantity: number;
  warehouseId: string;
  triggeredBy: string;
}

export interface ProcurementTriggeredEvent {
  companyId: string;
  productId: string;
  shortageQty: number;
  generatedOrderType: 'PURCHASE' | 'MANUFACTURING';
  generatedOrderId: string;
}

export interface InventoryAdjustedEvent {
  warehouseId: string;
  productId: string;
  adjustedBy: string;
  delta: number;
  newQty: number;
}
