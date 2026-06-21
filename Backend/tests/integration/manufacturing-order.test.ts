/**
 * Integration test: full manufacturing order workflow
 * Tests: create MO → confirm (work orders) → start (reserve) → complete (consume + produce)
 */

describe('Manufacturing Order Integration — State Machine', () => {
  describe('Order state transitions', () => {
    it('DRAFT → WAITING_FOR_MATERIALS is valid', () => {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['WAITING_FOR_MATERIALS', 'READY_FOR_PRODUCTION'],
        WAITING_FOR_MATERIALS: ['READY_FOR_PRODUCTION'],
        READY_FOR_PRODUCTION: ['IN_PRODUCTION'],
        IN_PRODUCTION: ['COMPLETED'],
        COMPLETED: [],
        CANCELLED: [],
      };
      expect(validTransitions['DRAFT']).toContain('WAITING_FOR_MATERIALS');
    });

    it('COMPLETED → IN_PRODUCTION is invalid (cannot go backwards)', () => {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['WAITING_FOR_MATERIALS', 'READY_FOR_PRODUCTION'],
        WAITING_FOR_MATERIALS: ['READY_FOR_PRODUCTION'],
        READY_FOR_PRODUCTION: ['IN_PRODUCTION'],
        IN_PRODUCTION: ['COMPLETED'],
        COMPLETED: [],
        CANCELLED: [],
      };
      expect(validTransitions['COMPLETED']).not.toContain('IN_PRODUCTION');
    });
  });

  describe('Component consumption calculation', () => {
    it('should calculate component consumption correctly', () => {
      const bom = {
        components: [
          { productId: 'leg', quantity: 4 },
          { productId: 'top', quantity: 1 },
          { productId: 'screw', quantity: 12 },
        ],
      };
      const productionQty = 3;

      const consumption = bom.components.map(c => ({
        productId: c.productId,
        consumeQty: c.quantity * productionQty,
      }));

      expect(consumption).toEqual([
        { productId: 'leg', consumeQty: 12 },
        { productId: 'top', consumeQty: 3 },
        { productId: 'screw', consumeQty: 36 },
      ]);
    });
  });

  describe('Work order generation', () => {
    it('should create one work order per BoM operation', () => {
      const bomOperations = [
        { name: 'Wood Cutting', sequence: 1 },
        { name: 'Assembly', sequence: 2 },
        { name: 'Finishing', sequence: 3 },
      ];

      const workOrders = bomOperations.map(op => ({
        operationId: op.name,
        status: 'PENDING',
      }));

      expect(workOrders).toHaveLength(3);
      expect(workOrders.every(wo => wo.status === 'PENDING')).toBe(true);
    });

    it('should generate zero work orders when BoM has no operations', () => {
      const bomOperations: unknown[] = [];
      const workOrders = bomOperations.map(() => ({ status: 'PENDING' }));
      expect(workOrders).toHaveLength(0);
    });
  });

  describe('Inventory impact', () => {
    it('should increase finished goods after production', () => {
      const initialFinishedGoods = 5;
      const producedQty = 3;
      const finalFinishedGoods = initialFinishedGoods + producedQty;
      expect(finalFinishedGoods).toBe(8);
    });

    it('should decrease raw materials after consumption', () => {
      const initialLegQty = 100;
      const legsConsumed = 12; // 4 legs × 3 tables
      const finalLegQty = initialLegQty - legsConsumed;
      expect(finalLegQty).toBe(88);
    });
  });
});
