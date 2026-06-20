import { bomRepository } from './bom.repository';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import { CreateBomDto, UpdateBomDto } from './bom.validator';

export class BomService {
  async list(companyId?: string, productId?: string) {
    return bomRepository.findAll(companyId, productId);
  }

  async getById(id: string) {
    const bom = await bomRepository.findById(id);
    if (!bom) throw AppError.notFound(MESSAGES.BOM.NOT_FOUND);
    return bom;
  }

  async create(dto: CreateBomDto) {
    if (!dto.components.length) throw AppError.badRequest(MESSAGES.BOM.NO_COMPONENTS);
    return bomRepository.create(dto);
  }

  async update(id: string, dto: UpdateBomDto) {
    await this.getById(id);
    return bomRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id);
    return bomRepository.delete(id);
  }
}

export const bomService = new BomService();
