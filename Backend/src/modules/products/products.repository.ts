import { ProcurementType, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { CreateProductDto, UpdateProductDto } from './products.validator';

const PRODUCT_INCLUDE = {
  unit: { select: { id: true, name: true, symbol: true } },
  category: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

export interface ProductFilters {
  page: number;
  limit: number;
  companyId?: string;
  categoryId?: string;
  search?: string;
  procurementType?: ProcurementType;
}

export class ProductsRepository {
  async findMany(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.procurementType && { procurementType: filters.procurementType }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findForExport(companyId?: string) {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(companyId && { companyId }),
      },
      include: {
        ...PRODUCT_INCLUDE,
        inventory: {
          select: { onHandQty: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });
  }

  async findBySku(companyId: string, sku: string) {
    return prisma.product.findFirst({
      where: { companyId, sku, deletedAt: null },
    });
  }

  async create(dto: CreateProductDto) {
    return prisma.product.create({
      data: {
        companyId: dto.companyId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        unitId: dto.unitId,
        categoryId: dto.categoryId,
        salesPrice: dto.salesPrice,
        costPrice: dto.costPrice,
        procureOnDemand: dto.procureOnDemand,
        procurementType: dto.procurementType,
        vendorId: dto.vendorId,
        bomId: dto.bomId,
      },
      include: PRODUCT_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    return prisma.product.update({
      where: { id },
      data: {
        ...(dto.sku && { sku: dto.sku }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unitId !== undefined && { unitId: dto.unitId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.salesPrice !== undefined && { salesPrice: dto.salesPrice }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.procureOnDemand !== undefined && { procureOnDemand: dto.procureOnDemand }),
        ...(dto.procurementType && { procurementType: dto.procurementType }),
        ...(dto.vendorId !== undefined && { vendorId: dto.vendorId }),
        ...(dto.bomId !== undefined && { bomId: dto.bomId }),
      },
      include: PRODUCT_INCLUDE,
    });
  }

  async softDelete(id: string) {
    return prisma.$transaction([
      prisma.inventory.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
  }
}

export const productsRepository = new ProductsRepository();
