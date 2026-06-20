import { usersRepository } from './users.repository';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './users.validator';

export class UsersService {
  async listUsers(filters: UserQueryDto) {
    return usersRepository.findMany({
      page: filters.page,
      limit: filters.limit,
      role: filters.role,
      isActive: filters.isActive,
      companyId: filters.companyId,
      search: filters.search,
    });
  }

  async getUserById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound(MESSAGES.USERS.NOT_FOUND);
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    // Check email uniqueness
    const existing = await usersRepository.findByEmail(dto.email);
    if (existing) {
      throw AppError.conflict(MESSAGES.USERS.EMAIL_EXISTS);
    }

    const passwordHash = await AuthService.hashPassword(dto.password);

    return usersRepository.create({
      companyId: dto.companyId,
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound(MESSAGES.USERS.NOT_FOUND);
    }

    return usersRepository.update(id, dto);
  }

  async deleteUser(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound(MESSAGES.USERS.NOT_FOUND);
    }

    await usersRepository.delete(id);
  }
}

export const usersService = new UsersService();
