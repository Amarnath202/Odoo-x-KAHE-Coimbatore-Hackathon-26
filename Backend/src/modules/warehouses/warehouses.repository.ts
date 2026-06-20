import prisma from '../../config/database';
import { CreateWarehouseDto, UpdateWarehouseDto } from './warehouses.validator';

export class WarehousesRepository {
  async findAll(companyId?: string, page = 1, limit = 20) {
    const where = companyId ? { companyId } : {};
    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: { company: { select: { id: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warehouse.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async create(dto: CreateWarehouseDto) {
    return prisma.warehouse.create({
      data: dto,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    return prisma.warehouse.update({ where: { id }, data: dto });
  }
}

export const warehousesRepository = new WarehousesRepository();
