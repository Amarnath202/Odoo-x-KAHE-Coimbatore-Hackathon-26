import prisma from '../../config/database';
import { CreateUnitDto, UpdateUnitDto } from './units.validator';

export class UnitsRepository {
  async findAll() {
    return prisma.unit.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    return prisma.unit.findUnique({ where: { id } });
  }

  async findBySymbol(symbol: string) {
    return prisma.unit.findUnique({ where: { symbol } });
  }

  async create(dto: CreateUnitDto) {
    return prisma.unit.create({ data: dto });
  }

  async update(id: string, dto: UpdateUnitDto) {
    return prisma.unit.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return prisma.unit.delete({ where: { id } });
  }
}

export const unitsRepository = new UnitsRepository();
