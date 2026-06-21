import { ManufacturingStatus, LedgerMovementType, WorkOrderStatus, PurchaseStatus } from '@prisma/client';
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
   * START Manufacturing Order: READY_FOR_PRODUCTION → IN_PRODUCTION
   * Reserves component inventory
   */
  async startOrder(orderId: string, userId: string, companyId: string) {
    const order = await manufacturingRepository.findById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    if (order.status !== ManufacturingStatus.READY_FOR_PRODUCTION) {
      throw AppError.badRequest('Manufacturing order must be READY_FOR_PRODUCTION to start');
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
        data: { status: ManufacturingStatus.IN_PRODUCTION },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'MANUFACTURING',
          action: 'CONFIRM',
          entityId: orderId,
          newValue: { status: 'IN_PRODUCTION' },
        },
      });
    });

    return manufacturingRepository.findById(orderId);
  }

  /**
   * COMPLETE Manufacturing Order: IN_PRODUCTION → COMPLETED
   * 1. Consume component stock (on_hand -= reserved component qty)
   * 2. Produce finished goods (on_hand += finished qty)
   * 3. Create ledger entries + audit log
   * All in ONE atomic transaction
   */
  async completeOrder(orderId: string, userId: string, companyId: string) {
    const order = await manufacturingRepository.findById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    if (order.status !== ManufacturingStatus.IN_PRODUCTION) {
      throw AppError.badRequest('Manufacturing order must be IN_PRODUCTION to complete');
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
        data: { status: ManufacturingStatus.COMPLETED },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'MANUFACTURING',
          action: 'COMPLETE',
          entityId: orderId,
          newValue: {
            status: 'COMPLETED',
            producedQty: qty,
            productId: order.productId,
          },
        },
      });
    });

    return manufacturingRepository.findById(orderId);
  }

  /**
   * CHECK AVAILABILITY
   * 1. Check all BOM components against Inventory
   * 2. If all available -> READY_FOR_PRODUCTION
   * 3. If missing -> WAITING_FOR_MATERIALS & generate PO(s)
   */
  async checkAvailability(orderId: string, userId: string, companyId: string) {
    const order = await manufacturingRepository.findById(orderId);
    if (!order) throw AppError.notFound(MESSAGES.MANUFACTURING.ORDER_NOT_FOUND);
    
    if (order.status !== ManufacturingStatus.DRAFT && order.status !== ManufacturingStatus.WAITING_FOR_MATERIALS) {
      throw AppError.badRequest('Availability check can only be done on DRAFT or WAITING_FOR_MATERIALS orders.');
    }

    const qty = Number(order.quantity);
    const warehouseId = order.warehouseId;
    let hasShortages = false;
    const shortagesByVendor: Record<string, any[]> = {};

    await prisma.$transaction(async (tx) => {
      // 1. Calculate Shortages
      for (const component of order.bom.components) {
        const requiredQty = Number(component.quantity) * qty;
        
        const inventory = await tx.inventory.findUnique({
          where: { warehouseId_productId: { warehouseId, productId: component.productId } }
        });
        
        const availableQty = inventory ? Number(inventory.freeToUseQty) : 0;
        
        if (availableQty < requiredQty) {
          hasShortages = true;
          const shortageQty = requiredQty - availableQty;
          
          // Use vendorId from product, or default if missing
          const vendorId = component.product.vendorId || 'NO_VENDOR';
          
          if (!shortagesByVendor[vendorId]) {
            shortagesByVendor[vendorId] = [];
          }
          
          shortagesByVendor[vendorId].push({
            productId: component.productId,
            shortageQty,
            costPrice: component.product.costPrice,
          });
        }
      }

      // 2. Process Shortages
      if (hasShortages) {
        for (const [vendorId, items] of Object.entries(shortagesByVendor)) {
          // If product doesn't have a vendor, find first available vendor for company or skip
          let validVendorId = vendorId;
          if (vendorId === 'NO_VENDOR') {
            const firstVendor = await tx.vendor.findFirst({ where: { companyId } });
            if (!firstVendor) throw AppError.badRequest('No vendors found to auto-generate PO.');
            validVendorId = firstVendor.id;
          }

          // Calculate total amount
          const totalAmount = items.reduce((sum, item) => sum + (Number(item.shortageQty) * Number(item.costPrice || 0)), 0);

          // Create PO
          const newPo = await tx.purchaseOrder.create({
            data: {
              companyId,
              vendorId: validVendorId,
              status: PurchaseStatus.DRAFT,
              totalAmount,
              autoGenerated: true,
              manufacturingOrderId: orderId,
              items: {
                create: items.map(item => ({
                  productId: item.productId,
                  quantity: item.shortageQty,
                  unitPrice: item.costPrice || 0,
                }))
              }
            }
          });

          // Create procurement logs
          await tx.procurementLog.createMany({
            data: items.map(item => ({
              companyId,
              triggerSource: 'MANUFACTURING_SHORTAGE',
              productId: item.productId,
              shortageQty: item.shortageQty,
              generatedOrderType: 'PURCHASE',
              generatedOrderId: newPo.id,
            }))
          });
        }

        await tx.manufacturingOrder.update({
          where: { id: orderId },
          data: { status: ManufacturingStatus.WAITING_FOR_MATERIALS }
        });

        await tx.auditLog.create({
          data: {
            companyId, userId, module: 'MANUFACTURING', action: 'UPDATE', entityId: orderId,
            newValue: { status: 'WAITING_FOR_MATERIALS', hasShortages: true }
          }
        });

      } else {
        // No shortages -> READY_FOR_PRODUCTION
        await tx.manufacturingOrder.update({
          where: { id: orderId },
          data: { status: ManufacturingStatus.READY_FOR_PRODUCTION }
        });

        await tx.auditLog.create({
          data: {
            companyId, userId, module: 'MANUFACTURING', action: 'UPDATE', entityId: orderId,
            newValue: { status: 'READY_FOR_PRODUCTION', hasShortages: false }
          }
        });
      }
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
