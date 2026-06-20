import prisma from '../../config/database';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.validator';

export class CategoriesRepository {
  async findAll(companyId?: string) {
    return prisma.category.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  async create(dto: CreateCategoryDto) {
    return prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    return prisma.category.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return prisma.category.delete({ where: { id } });
  }
}

export const categoriesRepository = new CategoriesRepository();
