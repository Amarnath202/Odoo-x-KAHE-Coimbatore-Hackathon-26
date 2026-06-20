import { LedgerMovementType } from '@prisma/client';
import { stockLedgerRepository } from './stock-ledger.repository';

export interface StockLedgerQuery {
  warehouseId?: string;
  productId?: string;
  companyId?: string;
  movementType?: LedgerMovementType;
  referenceType?: string;
  referenceId?: string;
  page: number;
  limit: number;
}

export class StockLedgerService {
  async list(query: StockLedgerQuery) {
    return stockLedgerRepository.findMany(query);
  }

  async getByProduct(productId: string, page: number, limit: number) {
    return stockLedgerRepository.findByProduct(productId, page, limit);
  }
}

export const stockLedgerService = new StockLedgerService();
