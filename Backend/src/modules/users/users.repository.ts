import { Role, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export interface UserFilters {
  page: number;
  limit: number;
  role?: Role;
  isActive?: boolean;
  companyId?: string;
  search?: string;
}

const USER_SELECT = {
  id: true,
  companyId: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export class UsersRepository {
  async findMany(filters: UserFilters) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  async create(data: {
    companyId: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }) {
    return prisma.user.create({
      data: { ...data, email: data.email.toLowerCase() },
      select: USER_SELECT,
    });
  }

  async update(id: string, data: Partial<{ name: string; role: Role; isActive: boolean }>) {
    return prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async delete(id: string) {
    // Nullify userId in audit logs to avoid foreign key constraints
    await prisma.auditLog.updateMany({
      where: { userId: id },
      data: { userId: null },
    });

    return prisma.user.delete({
      where: { id },
    });
  }
}

export const usersRepository = new UsersRepository();
