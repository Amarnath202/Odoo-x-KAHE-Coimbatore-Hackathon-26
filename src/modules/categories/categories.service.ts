import { categoriesRepository } from './categories.repository';
import { AppError } from '../../common/utils/AppError';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.validator';

export class CategoriesService {
  async list(companyId?: string) {
    return categoriesRepository.findAll(companyId);
  }

  async getById(id: string) {
    const cat = await categoriesRepository.findById(id);
    if (!cat) throw AppError.notFound('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    return categoriesRepository.create(dto);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.getById(id);
    return categoriesRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id);
    return categoriesRepository.delete(id);
  }
}

export const categoriesService = new CategoriesService();
