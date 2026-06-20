import prisma from '../../config/database';
import { CreateCompanyDto, UpdateCompanyDto } from './companies.validator';

export class CompaniesRepository {
  async findAll(page: number, limit: number) {
    const [data, total] = await Promise.all([
      prisma.company.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count(),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.company.findUnique({ where: { id } });
  }

  async create(dto: CreateCompanyDto) {
    return prisma.company.create({ data: dto });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    return prisma.company.update({ where: { id }, data: dto });
  }
}

export const companiesRepository = new CompaniesRepository();
