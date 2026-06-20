import { unitsRepository } from './units.repository';
import { AppError } from '../../common/utils/AppError';
import { CreateUnitDto, UpdateUnitDto } from './units.validator';

export class UnitsService {
  async list() {
    return unitsRepository.findAll();
  }

  async getById(id: string) {
    const unit = await unitsRepository.findById(id);
    if (!unit) throw AppError.notFound('Unit not found');
    return unit;
  }

  async create(dto: CreateUnitDto) {
    const existing = await unitsRepository.findBySymbol(dto.symbol);
    if (existing) throw AppError.conflict(`Unit symbol '${dto.symbol}' already exists`);
    return unitsRepository.create(dto);
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.getById(id);
    if (dto.symbol) {
      const existing = await unitsRepository.findBySymbol(dto.symbol);
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Unit symbol '${dto.symbol}' already exists`);
      }
    }
    return unitsRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id);
    return unitsRepository.delete(id);
  }
}

export const unitsService = new UnitsService();
