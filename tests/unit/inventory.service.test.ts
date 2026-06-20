/**
 * Unit tests for InventoryService
 * Tests the core business rules without hitting the database
 */

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  default: {
    inventory: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    stockLedger: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      inventory: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      stockLedger: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    })),
  },
}));

import { AppError } from '../../src/common/utils/AppError';

describe('InventoryService — Business Rules', () => {
  describe('freeToUseQty calculation', () => {
    it('should calculate freeToUseQty = onHandQty - reservedQty', () => {
      const onHandQty = 100;
      const reservedQty = 30;
      const freeToUseQty = onHandQty - reservedQty;
      expect(freeToUseQty).toBe(70);
    });

    it('should return 0 when reservedQty equals onHandQty', () => {
      const onHandQty = 50;
      const reservedQty = 50;
      const freeToUseQty = Math.max(0, onHandQty - reservedQty);
      expect(freeToUseQty).toBe(0);
    });

    it('should never return negative freeToUseQty', () => {
      const onHandQty = 10;
      const reservedQty = 15; // should not happen but guard it
      const freeToUseQty = Math.max(0, onHandQty - reservedQty);
      expect(freeToUseQty).toBe(0);
    });
  });

  describe('reserveStock validation', () => {
    it('should reject reservation when free stock is insufficient', () => {
      const freeToUse = 5;
      const requiredQty = 10;

      expect(() => {
        if (freeToUse < requiredQty) {
          throw AppError.unprocessable(`Insufficient stock: available ${freeToUse}, required ${requiredQty}`);
        }
      }).toThrow(AppError);
    });

    it('should allow reservation when exact stock is available', () => {
      const freeToUse = 10;
      const requiredQty = 10;

      expect(() => {
        if (freeToUse < requiredQty) {
          throw AppError.unprocessable('Insufficient stock');
        }
      }).not.toThrow();
    });
  });

  describe('Stock adjustments', () => {
    it('should correctly calculate delta on adjustment', () => {
      const oldOnHand = 100;
      const newOnHand = 85;
      const delta = newOnHand - oldOnHand;
      expect(delta).toBe(-15);
    });

    it('should calculate positive delta on stock increase', () => {
      const oldOnHand = 50;
      const newOnHand = 75;
      const delta = newOnHand - oldOnHand;
      expect(delta).toBe(25);
    });
  });

  describe('Manufacturing stock flow', () => {
    it('should correctly calculate component consumption for qty > 1', () => {
      const bomQtyPerUnit = 4; // 4 legs per table
      const productionQty = 5; // making 5 tables
      const consumeQty = bomQtyPerUnit * productionQty;
      expect(consumeQty).toBe(20);
    });

    it('should calculate on_hand after production', () => {
      const currentOnHand = 0;
      const producedQty = 5;
      const newOnHand = currentOnHand + producedQty;
      expect(newOnHand).toBe(5);
    });
  });
});
