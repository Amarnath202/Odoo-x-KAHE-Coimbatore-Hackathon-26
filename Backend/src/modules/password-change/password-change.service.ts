import prisma from '../../config/database';
import { AppError } from '../../common/utils/AppError';
import bcrypt from 'bcrypt';
import { RequestStatus } from '@prisma/client';

const SALT_ROUNDS = 12;

export class PasswordChangeService {
  async createRequest(userId: string, reason: string) {
    const existingPending = await prisma.passwordChangeRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existingPending) {
      throw AppError.badRequest('You already have a pending password change request.');
    }

    return prisma.passwordChangeRequest.create({
      data: {
        userId,
        reason,
        status: 'PENDING',
      },
    });
  }

  async getMyRequests(userId: string) {
    return prisma.passwordChangeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRequests() {
    return prisma.passwordChangeRequest.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRequest(requestId: string) {
    const request = await prisma.passwordChangeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw AppError.notFound('Request not found');
    if (request.status !== 'PENDING') throw AppError.badRequest('Request is not pending');

    return prisma.passwordChangeRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectRequest(requestId: string) {
    const request = await prisma.passwordChangeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw AppError.notFound('Request not found');
    if (request.status !== 'PENDING') throw AppError.badRequest('Request is not pending');

    return prisma.passwordChangeRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  }

  async resetPassword(userId: string, requestId: string, newPassword: string) {
    const request = await prisma.passwordChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw AppError.notFound('Request not found');
    if (request.userId !== userId) throw AppError.forbidden('Request belongs to another user');
    if (request.status !== 'APPROVED') throw AppError.badRequest('Request is not approved');

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordChangeRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED' },
      }),
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      }),
    ]);
  }
}

export const passwordChangeService = new PasswordChangeService();
