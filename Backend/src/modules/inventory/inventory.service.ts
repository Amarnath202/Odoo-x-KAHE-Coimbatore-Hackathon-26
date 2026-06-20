import { LedgerMovementType, Prisma } from '@prisma/client';
import { inventoryRepository } from './inventory.repository';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import { StockAdjustmentDto, InventoryQueryDto } from './inventory.validator';
import prisma from '../../config/database';

// ============================================================
// INVENTORY SERVICE — Single Owner of All Inventory Writes
//
// NO other module writes to the inventory table directly.
// All mutations flow through this service.
//
// Flow: Sales/Purchase/Mfg Service
//       → InventoryService
//       → InventoryRepository (Prisma)
//       + StockLedger entry   (same transaction)
//       + AuditLog entry      (same transaction)
// ============================================================

export interface ReserveStockParams {
  warehouseId: string;
  productId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  userId?: string;
  tx: Prisma.TransactionClient;
}

export interface ReleaseReservationParams {
  warehouseId: string;
  productId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  userId?: string;
  tx: Prisma.TransactionClient;
}

export interface DeductStockParams {
  warehouseId: string;
  productId: string;
  quantity: number;
  movementType: LedgerMovementType;
  referenceType: string;
  referenceId: string;
  userId?: string;
  tx: Prisma.TransactionClient;
}

export interface AddStockParams {
  warehouseId: string;
  productId: string;
  quantity: number;
  movementType: LedgerMovementType;
  referenceType: string;
  referenceId: string;
  userId?: string;
  tx: Prisma.TransactionClient;
}

export class InventoryService {
  /**
   * Get inventory list with filters
   */
  async list(query: InventoryQueryDto) {
    return inventoryRepository.findMany({
      warehouseId: query.warehouseId,
      productId: query.productId,
      companyId: query.companyId,
      page: query.page,
      limit: query.limit,
    });
  }

  async getExportData(companyId?: string) {
    return inventoryRepository.findForExport(companyId);
  }

  /**
   * Get inventory for a specific product in a warehouse
   */
  async getStock(warehouseId: string, productId: string) {
    return inventoryRepository.findOrCreate(warehouseId, productId);
  }

  /**
   * Check if enough free stock is available (throws if not)
   */
  async assertSufficientStock(
    warehouseId: string,
    productId: string,
    requiredQty: number,
    tx?: Prisma.TransactionClient,
  ): Promise<{ freeToUseQty: number; onHandQty: number; reservedQty: number }> {
    const inventory = await inventoryRepository.findOrCreate(warehouseId, productId, tx);
    const freeToUse = Number(inventory.freeToUseQty);

    if (freeToUse < requiredQty) {
      throw AppError.unprocessable(
        `${MESSAGES.INVENTORY.INSUFFICIENT}: available ${freeToUse}, required ${requiredQty}`,
      );
    }

    return {
      freeToUseQty: freeToUse,
      onHandQty: Number(inventory.onHandQty),
      reservedQty: Number(inventory.reservedQty),
    };
  }

  /**
   * RESERVE stock (Sales Confirm / Mfg Start)
   * reserved_qty += quantity
   */
  async reserveStock(params: ReserveStockParams): Promise<void> {
    const { warehouseId, productId, quantity, referenceType, referenceId, userId, tx } = params;

    const current = await inventoryRepository.findOrCreate(warehouseId, productId, tx);
    const newReserved = Number(current.reservedQty) + quantity;

    await inventoryRepository.updateQuantities(warehouseId, productId, { reservedQty: newReserved }, tx);

    // Stock ledger entry (same tx)
    await tx.stockLedger.create({
      data: {
        warehouseId,
        productId,
        movementType: LedgerMovementType.STOCK_ADJUSTMENT,
        qtyBefore: Number(current.onHandQty),
        qtyChanged: 0, // reserve doesn't change physical stock
        qtyAfter: Number(current.onHandQty),
        referenceType,
        referenceId,
        createdBy: userId,
      },
    });
  }

  /**
   * RELEASE reservation (Sales Cancel / error rollback)
   * reserved_qty -= quantity
   */
  async releaseReservation(params: ReleaseReservationParams): Promise<void> {
    const { warehouseId, productId, quantity, tx } = params;

    const current = await inventoryRepository.findOrCreate(warehouseId, productId, tx);
    const newReserved = Math.max(0, Number(current.reservedQty) - quantity);

    await inventoryRepository.updateQuantities(warehouseId, productId, { reservedQty: newReserved }, tx);
  }

  /**
   * DEDUCT stock (Sales Deliver / Mfg consumption)
   * on_hand_qty -= quantity, reserved_qty -= quantity
   */
  async deductStock(params: DeductStockParams): Promise<void> {
    const { warehouseId, productId, quantity, movementType, referenceType, referenceId, userId, tx } = params;

    const current = await inventoryRepository.findOrCreate(warehouseId, productId, tx);
    const currentOnHand = Number(current.onHandQty);
    const currentReserved = Number(current.reservedQty);

    const newOnHand = currentOnHand - quantity;
    const newReserved = Math.max(0, currentReserved - quantity);

    await inventoryRepository.updateQuantities(
      warehouseId,
      productId,
      { onHandQty: newOnHand, reservedQty: newReserved },
      tx,
    );

    // Create a ledger entry to record the delivery.
    await tx.stockLedger.create({
      data: {
        warehouseId,
        productId,
        movementType,
        qtyBefore: currentOnHand,
        qtyChanged: -quantity,
        qtyAfter: newOnHand,
        referenceType,
        referenceId,
        createdBy: userId,
      },
    });
  }

  /**
   * ADD stock (Purchase Receive / Mfg production)
   * on_hand_qty += quantity
   */
  async addStock(params: AddStockParams): Promise<void> {
    const { warehouseId, productId, quantity, movementType, referenceType, referenceId, userId, tx } = params;

    const current = await inventoryRepository.findOrCreate(warehouseId, productId, tx);
    const currentOnHand = Number(current.onHandQty);
    const newOnHand = currentOnHand + quantity;

    await inventoryRepository.updateQuantities(warehouseId, productId, { onHandQty: newOnHand }, tx);

    // Stock ledger entry
    await tx.stockLedger.create({
      data: {
        warehouseId,
        productId,
        movementType,
        qtyBefore: currentOnHand,
        qtyChanged: quantity,
        qtyAfter: newOnHand,
        referenceType,
        referenceId,
        createdBy: userId,
      },
    });
  }

  /**
   * ADJUST stock (manual inventory correction)
   * Sets on_hand_qty to a specific value and creates ledger + audit log
   */
  async adjustStock(dto: StockAdjustmentDto, userId: string, companyId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const current = await inventoryRepository.findOrCreate(dto.warehouseId, dto.productId, tx);
      const oldOnHand = Number(current.onHandQty);
      const delta = dto.newOnHandQty - oldOnHand;

      await inventoryRepository.updateQuantities(
        dto.warehouseId,
        dto.productId,
        { onHandQty: dto.newOnHandQty },
        tx,
      );

      // Stock ledger
      await tx.stockLedger.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          movementType: LedgerMovementType.STOCK_ADJUSTMENT,
          qtyBefore: oldOnHand,
          qtyChanged: delta,
          qtyAfter: dto.newOnHandQty,
          referenceType: 'STOCK_ADJUSTMENT',
          referenceId: 'MANUAL',
          createdBy: userId,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          module: 'INVENTORY',
          action: 'ADJUST',
          entityId: dto.productId,
          oldValue: { onHandQty: oldOnHand },
          newValue: { onHandQty: dto.newOnHandQty, reason: dto.reason },
        },
      });
    });
  }
}

export const inventoryService = new InventoryService();
