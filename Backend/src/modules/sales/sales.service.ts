import { OrderStatus, LedgerMovementType } from '@prisma/client';
import prisma from '../../config/database';
import { salesRepository } from './sales.repository';
import { inventoryService } from '../inventory/inventory.service';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateSalesOrderDto,
  ConfirmSalesOrderDto,
  DeliverSalesOrderDto,
  SalesOrderQueryDto,
} from './sales.validator';
import { eventEmitter } from '../../common/events/eventEmitter';
import { ERP_EVENTS } from '../../common/events/events.types';

export class SalesService {
  // ─── Customers ─────────────────────────────────────────────

  async listCustomers(companyId?: string, page = 1, limit = 20) {
    return salesRepository.findCustomers(companyId, page, limit);
  }

  async createCustomer(dto: CreateCustomerDto) {
    return salesRepository.createCustomer(dto);
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const customer = await salesRepository.findCustomerById(id);
    if (!customer) throw AppError.notFound(MESSAGES.SALES.CUSTOMER_NOT_FOUND);
    return salesRepository.updateCustomer(id, dto);
  }

  async deleteCustomer(id: string) {
    const customer = await salesRepository.findCustomerById(id);
    if (!customer) throw AppError.notFound(MESSAGES.SALES.CUSTOMER_NOT_FOUND);
    return salesRepository.softDeleteCustomer(id);
  }

  // ─── Sales Orders ───────────────────────────────────────────

  async listOrders(query: SalesOrderQueryDto) {
    return salesRepository.findOrders(query);
  }

  async getExportData(companyId?: string, month?: number, year?: number) {
    return salesRepository.findForExport(companyId, month, year);
  }

  async getOrderById(id: string) {
    const order = await salesRepository.findOrderById(id);
    if (!order) throw AppError.notFound(MESSAGES.SALES.ORDER_NOT_FOUND);
    return order;
  }

  async createOrder(dto: CreateSalesOrderDto) {
    const customer = await salesRepository.findCustomerById(dto.customerId);
    if (!customer) throw AppError.notFound(MESSAGES.SALES.CUSTOMER_NOT_FOUND);
    return salesRepository.createOrder(dto);
  }

  /**
   * CONFIRM Sales Order:
   * 1. Validate state
   * 2. For each item: check inventory availability
   * 3. Reserve stock (reservedQty +=)
   * 4. Create stock ledger + audit log
   * 5. Trigger procurement automation for shortages
   * All in ONE atomic transaction
   */
  async confirmOrder(
    orderId: string,
    dto: ConfirmSalesOrderDto,
    userId: string,
    companyId: string,
  ) {
    const order = await salesRepository.findOrderById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.SALES.ORDER_NOT_FOUND);
    if (order.status !== OrderStatus.DRAFT) {
      throw AppError.badRequest(MESSAGES.SALES.ALREADY_CONFIRMED);
    }

    const shortageItems: Array<{ productId: string; shortageQty: number }> = [];

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const qty = Number(item.quantity);
        const inventory = await tx.inventory.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: dto.warehouseId,
              productId: item.productId,
            },
          },
        });

        const freeToUse = inventory ? Number(inventory.freeToUseQty) : 0;

        if (freeToUse >= qty) {
          // Enough stock — reserve it
          await inventoryService.reserveStock({
            warehouseId: dto.warehouseId,
            productId: item.productId,
            quantity: qty,
            referenceType: 'SALES_ORDER',
            referenceId: orderId,
            userId,
            tx,
          });
        } else {
          // Shortage — check if procure_on_demand
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product?.procureOnDemand) {
            shortageItems.push({ productId: item.productId, shortageQty: qty - freeToUse });
          }
          // Reserve what's available
          if (freeToUse > 0) {
            await inventoryService.reserveStock({
              warehouseId: dto.warehouseId,
              productId: item.productId,
              quantity: freeToUse,
              referenceType: 'SALES_ORDER',
              referenceId: orderId,
              userId,
              tx,
            });
          }
        }
      }

      await tx.salesOrder.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'SALES',
          action: 'CONFIRM',
          entityId: orderId,
          oldValue: { status: 'DRAFT' },
          newValue: { status: 'CONFIRMED', warehouseId: dto.warehouseId },
        },
      });
    });

    // Fire events AFTER transaction commits (procurement automation)
    for (const shortage of shortageItems) {
      eventEmitter.emit(ERP_EVENTS.PROCUREMENT_TRIGGERED, {
        companyId,
        productId: shortage.productId,
        shortageQty: shortage.shortageQty,
        triggerSource: `SALES_ORDER:${orderId}`,
        userId,
      });
    }

    return salesRepository.findOrderById(orderId);
  }

  /**
   * DELIVER Sales Order:
   * 1. Validate order state
   * 2. Deduct stock (on_hand_qty -= delivered_qty, reserved_qty -= delivered_qty)
   * 3. Update delivered quantities per item
   * 4. Update order status (PARTIALLY_DELIVERED or FULLY_DELIVERED)
   * 5. Create stock ledger + audit log
   * All in ONE atomic transaction
   */
  async deliverOrder(
    orderId: string,
    dto: DeliverSalesOrderDto,
    userId: string,
    companyId: string,
  ) {
    const order = await salesRepository.findOrderById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.SALES.ORDER_NOT_FOUND);

    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.PARTIALLY_DELIVERED
    ) {
      throw AppError.badRequest('Order must be CONFIRMED or PARTIALLY_DELIVERED to deliver');
    }

    await prisma.$transaction(async (tx) => {
      for (const delivery of dto.items) {
        const orderItem = order.items.find((i) => i.id === delivery.salesOrderItemId);
        if (!orderItem) {
          throw AppError.notFound(`Sales order item ${delivery.salesOrderItemId} not found`);
        }

        const remainingQty = Number(orderItem.quantity) - Number(orderItem.deliveredQty);
        if (delivery.deliveredQty > remainingQty) {
          throw AppError.badRequest(
            `Delivery quantity exceeds remaining quantity for item ${orderItem.product.sku}`,
          );
        }

        // Deduct from inventory
        await inventoryService.deductStock({
          warehouseId: dto.warehouseId,
          productId: orderItem.productId,
          quantity: delivery.deliveredQty,
          movementType: LedgerMovementType.SALES_DELIVERY,
          referenceType: 'SALES_ORDER',
          referenceId: orderId,
          userId,
          tx,
        });

        // Update delivered qty
        await tx.salesOrderItem.update({
          where: { id: delivery.salesOrderItemId },
          data: { deliveredQty: Number(orderItem.deliveredQty) + delivery.deliveredQty },
        });
      }

      // Determine new order status
      const updatedItems = await tx.salesOrderItem.findMany({ where: { salesOrderId: orderId } });
      const allDelivered = updatedItems.every(
        (i) => Number(i.deliveredQty) >= Number(i.quantity),
      );
      const newStatus = allDelivered
        ? OrderStatus.FULLY_DELIVERED
        : OrderStatus.PARTIALLY_DELIVERED;

      await tx.salesOrder.update({ where: { id: orderId }, data: { status: newStatus } });

      // Audit log
      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'SALES',
          action: 'DELIVER',
          entityId: orderId,
          newValue: { status: newStatus, deliveries: dto.items },
        },
      });
    });

    return salesRepository.findOrderById(orderId);
  }

  /**
   * CANCEL Sales Order:
   * Release reserved stock and set status to CANCELLED
   */
  async cancelOrder(orderId: string, userId: string, companyId: string, warehouseId: string) {
    const order = await salesRepository.findOrderById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.SALES.ORDER_NOT_FOUND);

    if (order.status === OrderStatus.FULLY_DELIVERED) {
      throw AppError.badRequest(MESSAGES.SALES.CANNOT_CANCEL);
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw AppError.badRequest('Order is already cancelled');
    }

    await prisma.$transaction(async (tx) => {
      // Release reservations
      if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PARTIALLY_DELIVERED) {
        for (const item of order.items) {
          const undeliveredQty = Number(item.quantity) - Number(item.deliveredQty);
          if (undeliveredQty > 0) {
            await inventoryService.releaseReservation({
              warehouseId,
              productId: item.productId,
              quantity: undeliveredQty,
              referenceType: 'SALES_ORDER',
              referenceId: orderId,
              userId,
              tx,
            });
          }
        }
      }

      await tx.salesOrder.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED } });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'SALES',
          action: 'CANCEL',
          entityId: orderId,
          oldValue: { status: order.status },
          newValue: { status: 'CANCELLED' },
        },
      });
    });

    return salesRepository.findOrderById(orderId);
  }

  /**
   * DELETE Sales Order:
   * Hard delete from DB. Items cascade.
   */
  async deleteOrder(orderId: string) {
    const order = await salesRepository.findOrderById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.SALES.ORDER_NOT_FOUND);
    return prisma.salesOrder.delete({ where: { id: orderId } });
  }
}

export const salesService = new SalesService();
