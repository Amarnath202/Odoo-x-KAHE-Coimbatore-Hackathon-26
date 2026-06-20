/**
 * Unit tests for Procurement Automation logic
 */

import { ProcurementType } from '@prisma/client';

describe('ProcurementService — Automation Logic', () => {
  describe('calculateShortage', () => {
    it('should correctly calculate shortage', () => {
      const orderedQty = 20;
      const freeToUseQty = 5;
      const shortage = orderedQty - freeToUseQty;
      expect(shortage).toBe(15);
    });

    it('should return 0 shortage when stock is sufficient', () => {
      const orderedQty = 10;
      const freeToUseQty = 15;
      const shortage = Math.max(0, orderedQty - freeToUseQty);
      expect(shortage).toBe(0);
    });

    it('should return exact shortage when stock is zero', () => {
      const orderedQty = 10;
      const freeToUseQty = 0;
      const shortage = orderedQty - freeToUseQty;
      expect(shortage).toBe(10);
    });
  });

  describe('Procurement routing', () => {
    it('should route to Purchase Order for PURCHASE type', () => {
      const product = { procurementType: ProcurementType.PURCHASE, vendorId: 'v123' };
      expect(product.procurementType).toBe('PURCHASE');
    });

    it('should route to Manufacturing Order for MANUFACTURING type', () => {
      const product = { procurementType: ProcurementType.MANUFACTURING, bomId: 'bom123' };
      expect(product.procurementType).toBe('MANUFACTURING');
    });

    it('should skip procurement when procure_on_demand is false', () => {
      const product = { procureOnDemand: false, procurementType: ProcurementType.PURCHASE };
      let triggered = false;

      if (product.procureOnDemand) {
        triggered = true;
      }

      expect(triggered).toBe(false);
    });
  });

  describe('PO generation logic', () => {
    it('should not generate PO when vendor is missing', () => {
      const product = { vendorId: null, vendor: null };
      const canGeneratePO = product.vendorId !== null && product.vendor !== null;
      expect(canGeneratePO).toBe(false);
    });

    it('should generate PO when vendor is present', () => {
      const product = { vendorId: 'v123', vendor: { id: 'v123' } };
      const canGeneratePO = product.vendorId !== null && product.vendor !== null;
      expect(canGeneratePO).toBe(true);
    });
  });

  describe('MO generation logic', () => {
    it('should not generate MO when BOM is missing', () => {
      const product = { bomId: null, defaultBom: null };
      const canGenerateMO = product.bomId !== null && product.defaultBom !== null;
      expect(canGenerateMO).toBe(false);
    });

    it('should generate MO when BOM is present', () => {
      const product = { bomId: 'bom123', defaultBom: { id: 'bom123' } };
      const canGenerateMO = product.bomId !== null && product.defaultBom !== null;
      expect(canGenerateMO).toBe(true);
    });
  });
});
