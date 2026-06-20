import { OrderStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { CreateCustomerDto, UpdateCustomerDto, CreateSalesOrderDto } from './sales.validator';

const ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, email: true } },
  company: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, name: true, unit: { select: { symbol: true } } } },
    },
  },
} satisfies Prisma.SalesOrderInclude;

export class SalesRepository {
  // ─── Customers ─────────────────────────────────────────────

  async findCustomers(companyId?: string, page = 1, limit = 20) {
    const where: Prisma.CustomerWhereInput = { deletedAt: null, ...(companyId && { companyId }) };
    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      prisma.customer.count({ where }),
    ]);
    return { data, total };
  }

  async findCustomerById(id: string) {
    return prisma.customer.findFirst({ where: { id, deletedAt: null } });
  }

  async createCustomer(dto: CreateCustomerDto) {
    return prisma.customer.create({ data: dto });
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    return prisma.customer.update({ where: { id }, data: dto });
  }

  async softDeleteCustomer(id: string) {
    return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ─── Sales Orders ───────────────────────────────────────────

  async findOrders(filters: {
    page: number;
    limit: number;
    companyId?: string;
    customerId?: string;
    status?: OrderStatus;
  }) {
    const where: Prisma.SalesOrderWhereInput = {
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.status && { status: filters.status }),
    };

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: ORDER_INCLUDE,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesOrder.count({ where }),
    ]);
    return { data, total };
  }

  async findOrderById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.salesOrder.findUnique({ where: { id }, include: ORDER_INCLUDE });
  }

  async createOrder(dto: CreateSalesOrderDto) {
    const totalAmount = dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    return prisma.salesOrder.create({
      data: {
        companyId: dto.companyId,
        customerId: dto.customerId,
        notes: dto.notes,
        totalAmount,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.salesOrder.update({ where: { id }, data: { status } });
  }

  async updateItemDeliveredQty(
    itemId: string,
    deliveredQty: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.salesOrderItem.update({
      where: { id: itemId },
      data: { deliveredQty },
    });
  }
}

export const salesRepository = new SalesRepository();
