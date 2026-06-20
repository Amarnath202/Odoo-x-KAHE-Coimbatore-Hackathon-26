import prisma from '../../config/database';
import { CreateBomDto, UpdateBomDto } from './bom.validator';

const BOM_INCLUDE = {
  product: { select: { id: true, sku: true, name: true } },
  company: { select: { id: true, name: true } },
  components: {
    include: {
      product: { select: { id: true, sku: true, name: true } },
      unit: { select: { id: true, symbol: true } },
    },
  },
  operations: { orderBy: { sequence: 'asc' as const } },
};

export class BomRepository {
  async findAll(companyId?: string, productId?: string) {
    return prisma.bom.findMany({
      where: {
        ...(companyId && { companyId }),
        ...(productId && { productId }),
      },
      include: BOM_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.bom.findUnique({ where: { id }, include: BOM_INCLUDE });
  }

  async create(dto: CreateBomDto) {
    return prisma.bom.create({
      data: {
        companyId: dto.companyId,
        productId: dto.productId,
        name: dto.name,
        version: dto.version,
        components: {
          create: dto.components.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            unitId: c.unitId,
          })),
        },
        operations: {
          create: dto.operations.map((o) => ({
            name: o.name,
            sequence: o.sequence,
            durationMinutes: o.durationMinutes,
          })),
        },
      },
      include: BOM_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateBomDto) {
    // Replace components and operations entirely on update
    return prisma.$transaction(async (tx) => {
      if (dto.components) {
        await tx.bomComponent.deleteMany({ where: { bomId: id } });
        await tx.bomComponent.createMany({
          data: dto.components.map((c) => ({
            bomId: id,
            productId: c.productId,
            quantity: c.quantity,
            unitId: c.unitId,
          })),
        });
      }

      if (dto.operations) {
        await tx.bomOperation.deleteMany({ where: { bomId: id } });
        await tx.bomOperation.createMany({
          data: dto.operations.map((o) => ({
            bomId: id,
            name: o.name,
            sequence: o.sequence,
            durationMinutes: o.durationMinutes,
          })),
        });
      }

      return tx.bom.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.version && { version: dto.version }),
        },
        include: BOM_INCLUDE,
      });
    });
  }

  async delete(id: string) {
    return prisma.bom.delete({ where: { id } });
  }
}

export const bomRepository = new BomRepository();
