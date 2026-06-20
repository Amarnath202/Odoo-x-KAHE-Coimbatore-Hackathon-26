import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dayjs from 'dayjs';
import prisma from '../../config/database';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import { JwtPayload } from '../../common/types';
import { LoginDto, ChangePasswordDto } from './auth.validator';

const SALT_ROUNDS = 12;

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  /**
   * Login — verify credentials, return access token + set refresh cookie
   */
  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      companyId: string;
    };
  }> {
    // Find active user
    const user = await prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        deletedAt: null,
      },
    });

    if (!user) {
      throw AppError.unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw AppError.unauthorized(MESSAGES.AUTH.ACCOUNT_DISABLED);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Build JWT payload
    const jwtPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      name: user.name,
    };

    // Generate tokens
    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    // Persist refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: dayjs().add(7, 'day').toDate(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  /**
   * Refresh — verify refresh token, return new access token
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken || !storedToken.user.isActive || storedToken.user.deletedAt) {
      throw AppError.unauthorized(MESSAGES.AUTH.REFRESH_INVALID);
    }

    const payload: JwtPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      companyId: storedToken.user.companyId,
      name: storedToken.user.name,
    };

    const accessToken = generateAccessToken(payload);
    return { accessToken };
  }

  /**
   * Logout — revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  /**
   * Change password
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw AppError.notFound(MESSAGES.USERS.NOT_FOUND);
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.badRequest('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      // Revoke all refresh tokens on password change
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      }),
    ]);
  }

  /**
   * Hash a plain-text password (used during user creation)
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }
}

export const authService = new AuthService();
