import { PurchaseStatus, LedgerMovementType } from '@prisma/client';
import prisma from '../../config/database';
import { purchaseRepository } from './purchase.repository';
import { inventoryService } from '../inventory/inventory.service';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import {
  CreateVendorDto,
  UpdateVendorDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  PurchaseOrderQueryDto,
} from './purchase.validator';

export class PurchaseService {
  // ─── Vendors ────────────────────────────────────────────────

  async listVendors(companyId?: string, page = 1, limit = 20) {
    return purchaseRepository.findVendors(companyId, page, limit);
  }

  async createVendor(dto: CreateVendorDto) {
    return purchaseRepository.createVendor(dto);
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    const vendor = await purchaseRepository.findVendorById(id);
    if (!vendor) throw AppError.notFound(MESSAGES.PURCHASE.VENDOR_NOT_FOUND);
    return purchaseRepository.updateVendor(id, dto);
  }

  async deleteVendor(id: string) {
    const vendor = await purchaseRepository.findVendorById(id);
    if (!vendor) throw AppError.notFound(MESSAGES.PURCHASE.VENDOR_NOT_FOUND);
    return purchaseRepository.softDeleteVendor(id);
  }

  // ─── Purchase Orders ─────────────────────────────────────────

  async listOrders(query: PurchaseOrderQueryDto) {
    return purchaseRepository.findOrders(query);
  }

  async getOrderById(id: string) {
    const order = await purchaseRepository.findOrderById(id);
    if (!order) throw AppError.notFound(MESSAGES.PURCHASE.ORDER_NOT_FOUND);
    return order;
  }

  async createOrder(dto: CreatePurchaseOrderDto) {
    const vendor = await purchaseRepository.findVendorById(dto.vendorId);
    if (!vendor) throw AppError.notFound(MESSAGES.PURCHASE.VENDOR_NOT_FOUND);
    return purchaseRepository.createOrder(dto);
  }

  /**
   * CONFIRM Purchase Order: DRAFT → CONFIRMED
   */
  async confirmOrder(orderId: string, userId: string, companyId: string) {
    const order = await purchaseRepository.findOrderById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.PURCHASE.ORDER_NOT_FOUND);
    if (order.status !== PurchaseStatus.DRAFT) {
      throw AppError.badRequest(MESSAGES.PURCHASE.ALREADY_CONFIRMED);
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: PurchaseStatus.CONFIRMED },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'PURCHASE',
          action: 'CONFIRM',
          entityId: orderId,
          oldValue: { status: 'DRAFT' },
          newValue: { status: 'CONFIRMED' },
        },
      });
    });

    return purchaseRepository.findOrderById(orderId);
  }

  /**
   * RECEIVE Purchase Order:
   * 1. Validate order is CONFIRMED or PARTIALLY_RECEIVED
   * 2. For each item: add stock (on_hand_qty +=)
   * 3. Create stock ledger entry
   * 4. Update received quantities
   * 5. Update order status
   * All in ONE atomic transaction
   */
  async receiveOrder(
    orderId: string,
    dto: ReceivePurchaseOrderDto,
    userId: string,
    companyId: string,
  ) {
    const order = await purchaseRepository.findOrderById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.PURCHASE.ORDER_NOT_FOUND);

    if (
      order.status !== PurchaseStatus.CONFIRMED &&
      order.status !== PurchaseStatus.PARTIALLY_RECEIVED
    ) {
      throw AppError.badRequest('Purchase order must be CONFIRMED or PARTIALLY_RECEIVED to receive');
    }

    await prisma.$transaction(async (tx) => {
      for (const receipt of dto.items) {
        const orderItem = order.items.find((i) => i.id === receipt.purchaseOrderItemId);
        if (!orderItem) {
          throw AppError.notFound(`Purchase order item ${receipt.purchaseOrderItemId} not found`);
        }

        const remainingQty = Number(orderItem.quantity) - Number(orderItem.receivedQty);
        if (receipt.receivedQty > remainingQty) {
          throw AppError.badRequest(
            `Received qty exceeds remaining qty for product ${orderItem.product.sku}`,
          );
        }

        // Add stock via InventoryService (creates ledger entry in same tx)
        await inventoryService.addStock({
          warehouseId: dto.warehouseId,
          productId: orderItem.productId,
          quantity: receipt.receivedQty,
          movementType: LedgerMovementType.PURCHASE_RECEIPT,
          referenceType: 'PURCHASE_ORDER',
          referenceId: orderId,
          userId,
          tx,
        });

        // Update received qty
        await tx.purchaseOrderItem.update({
          where: { id: receipt.purchaseOrderItemId },
          data: { receivedQty: Number(orderItem.receivedQty) + receipt.receivedQty },
        });
      }

      // Determine new status
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: orderId } });
      const allReceived = updatedItems.every(
        (i) => Number(i.receivedQty) >= Number(i.quantity),
      );
      const newStatus = allReceived
        ? PurchaseStatus.FULLY_RECEIVED
        : PurchaseStatus.PARTIALLY_RECEIVED;

      await tx.purchaseOrder.update({ where: { id: orderId }, data: { status: newStatus } });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'PURCHASE',
          action: 'RECEIVE',
          entityId: orderId,
          newValue: { status: newStatus, warehouseId: dto.warehouseId, receipts: dto.items },
        },
      });
    });

    return purchaseRepository.findOrderById(orderId);
  }
}

export const purchaseService = new PurchaseService();
