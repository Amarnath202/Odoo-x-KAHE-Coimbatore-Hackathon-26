import { warehousesRepository } from './warehouses.repository';
import { AppError } from '../../common/utils/AppError';
import { CreateWarehouseDto, UpdateWarehouseDto } from './warehouses.validator';

export class WarehousesService {
  async list(companyId?: string, page = 1, limit = 20) {
    return warehousesRepository.findAll(companyId, page, limit);
  }

  async getById(id: string) {
    const wh = await warehousesRepository.findById(id);
    if (!wh) throw AppError.notFound('Warehouse not found');
    return wh;
  }

  async create(dto: CreateWarehouseDto) {
    return warehousesRepository.create(dto);
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.getById(id);
    return warehousesRepository.update(id, dto);
  }
}

export const warehousesService = new WarehousesService();
