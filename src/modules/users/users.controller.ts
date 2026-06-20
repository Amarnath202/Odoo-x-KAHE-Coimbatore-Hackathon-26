import { Request, Response } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './users.validator';

export class UsersController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as UserQueryDto;
    const { data, total } = await usersService.listUsers(query);
    sendPaginated(res, data, total, query.page, query.limit, 'Users retrieved');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const user = await usersService.getUserById(req.params['id']!);
    sendSuccess(res, user);
  }

  async create(req: Request, res: Response): Promise<void> {
    const user = await usersService.createUser(req.body as CreateUserDto);
    sendCreated(res, user, MESSAGES.USERS.CREATED);
  }

  async update(req: Request, res: Response): Promise<void> {
    const user = await usersService.updateUser(req.params['id']!, req.body as UpdateUserDto);
    sendSuccess(res, user, MESSAGES.UPDATED);
  }

  async delete(req: Request, res: Response): Promise<void> {
    await usersService.deleteUser(req.params['id']!);
    sendSuccess(res, null, MESSAGES.DELETED);
  }
}

export const usersController = new UsersController();
