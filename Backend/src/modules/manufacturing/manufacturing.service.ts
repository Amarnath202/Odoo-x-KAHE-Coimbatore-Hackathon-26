import { ManufacturingStatus, LedgerMovementType, WorkOrderStatus } from '@prisma/client';
import prisma from '../../config/database';
import { manufacturingRepository } from './manufacturing.repository';
import { inventoryService } from '../inventory/inventory.service';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import {
  CreateManufacturingOrderDto,
  ManufacturingOrderQueryDto,
} from './manufacturing.validator';

export class ManufacturingService {
  async list(query: ManufacturingOrderQueryDto) {
    return manufacturingRepository.findAll(query);
  }

  async getById(id: string) {
    const order = await manufacturingRepository.findById(id);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    return order;
  }

  async createOrder(dto: CreateManufacturingOrderDto) {
    return manufacturingRepository.create(dto);
  }

  /**
   * CONFIRM Manufacturing Order: DRAFT → CONFIRMED
   * Generates work orders from BoM operations
   */
  async confirmOrder(orderId: string, userId: string, companyId: string) {
    const order = await manufacturingRepository.findById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    if (order.status !== ManufacturingStatus.DRAFT) {
      throw AppError.badRequest('Manufacturing order is already confirmed');
    }

    await prisma.$transaction(async (tx) => {
      // Generate work orders from BoM operations
      const operations = order.bom.operations;
      if (operations.length > 0) {
        await tx.workOrder.createMany({
          data: operations.map((op) => ({
            manufacturingOrderId: orderId,
            operationId: op.id,
            status: WorkOrderStatus.PENDING,
          })),
        });
      }

      await tx.manufacturingOrder.update({
        where: { id: orderId },
        data: { status: ManufacturingStatus.CONFIRMED },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'MANUFACTURING',
          action: 'CONFIRM',
          entityId: orderId,
          oldValue: { status: 'DRAFT' },
          newValue: { status: 'CONFIRMED', workOrdersCreated: operations.length },
        },
      });
    });

    return manufacturingRepository.findById(orderId);
  }

  /**
   * START Manufacturing Order: CONFIRMED → IN_PROGRESS
   * Reserves component inventory
   */
  async startOrder(orderId: string, userId: string, companyId: string) {
    const order = await manufacturingRepository.findById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    if (order.status !== ManufacturingStatus.CONFIRMED) {
      throw AppError.badRequest('Manufacturing order must be CONFIRMED to start');
    }

    const qty = Number(order.quantity);
    const warehouseId = order.warehouseId;

    await prisma.$transaction(async (tx) => {
      // Reserve components
      for (const component of order.bom.components) {
        const requiredQty = Number(component.quantity) * qty;

        await inventoryService.reserveStock({
          warehouseId,
          productId: component.productId,
          quantity: requiredQty,
          referenceType: 'MANUFACTURING_ORDER',
          referenceId: orderId,
          userId,
          tx,
        });
      }

      // Update work orders to IN_PROGRESS
      await tx.workOrder.updateMany({
        where: { manufacturingOrderId: orderId, status: WorkOrderStatus.PENDING },
        data: { status: WorkOrderStatus.IN_PROGRESS, startedAt: new Date() },
      });

      await tx.manufacturingOrder.update({
        where: { id: orderId },
        data: { status: ManufacturingStatus.IN_PROGRESS },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'MANUFACTURING',
          action: 'CONFIRM',
          entityId: orderId,
          newValue: { status: 'IN_PROGRESS' },
        },
      });
    });

    return manufacturingRepository.findById(orderId);
  }

  /**
   * COMPLETE Manufacturing Order: IN_PROGRESS → DONE
   * 1. Consume component stock (on_hand -= reserved component qty)
   * 2. Produce finished goods (on_hand += finished qty)
   * 3. Create ledger entries + audit log
   * All in ONE atomic transaction
   */
  async completeOrder(orderId: string, userId: string, companyId: string) {
    const order = await manufacturingRepository.findById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    if (order.status !== ManufacturingStatus.IN_PROGRESS) {
      throw AppError.badRequest('Manufacturing order must be IN_PROGRESS to complete');
    }

    const qty = Number(order.quantity);
    const warehouseId = order.warehouseId;

    await prisma.$transaction(async (tx) => {
      // Consume each component
      for (const component of order.bom.components) {
        const consumeQty = Number(component.quantity) * qty;

        await inventoryService.deductStock({
          warehouseId,
          productId: component.productId,
          quantity: consumeQty,
          movementType: LedgerMovementType.MANUFACTURING_CONSUMPTION,
          referenceType: 'MANUFACTURING_ORDER',
          referenceId: orderId,
          userId,
          tx,
        });
      }

      // Produce finished goods
      await inventoryService.addStock({
        warehouseId,
        productId: order.productId,
        quantity: qty,
        movementType: LedgerMovementType.MANUFACTURING_PRODUCTION,
        referenceType: 'MANUFACTURING_ORDER',
        referenceId: orderId,
        userId,
        tx,
      });

      // Complete work orders
      await tx.workOrder.updateMany({
        where: { manufacturingOrderId: orderId },
        data: { status: WorkOrderStatus.DONE, completedAt: new Date() },
      });

      await tx.manufacturingOrder.update({
        where: { id: orderId },
        data: { status: ManufacturingStatus.DONE },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'MANUFACTURING',
          action: 'COMPLETE',
          entityId: orderId,
          newValue: {
            status: 'DONE',
            producedQty: qty,
            productId: order.productId,
          },
        },
      });
    });

    return manufacturingRepository.findById(orderId);
  }

  /**
   * DELETE Manufacturing Order:
   * Hard delete from DB. Work orders cascade.
   */
  async deleteOrder(orderId: string) {
    const order = await manufacturingRepository.findById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    return prisma.manufacturingOrder.delete({ where: { id: orderId } });
  }
}

export const manufacturingService = new ManufacturingService();
