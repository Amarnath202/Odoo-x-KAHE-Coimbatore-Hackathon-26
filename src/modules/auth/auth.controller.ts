import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../common/utils/response';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import { LoginDto, ChangePasswordDto } from './auth.validator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

export class AuthController {
  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const dto = req.body as LoginDto;

    const result = await authService.login(dto);

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    sendSuccess(
      res,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      MESSAGES.AUTH.LOGIN_SUCCESS,
    );
  }

  /**
   * POST /auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies['refreshToken'] || req.body.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/' });
    sendSuccess(res, null, MESSAGES.AUTH.LOGOUT_SUCCESS);
  }

  /**
   * POST /auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies['refreshToken'] || req.body.refreshToken;

    if (!refreshToken) {
      throw AppError.unauthorized(MESSAGES.AUTH.REFRESH_INVALID);
    }

    const result = await authService.refresh(refreshToken);
    sendSuccess(res, result, MESSAGES.AUTH.REFRESH_SUCCESS);
  }

  /**
   * POST /auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const dto = req.body as ChangePasswordDto;
    const userId = req.user!.id;

    await authService.changePassword(userId, dto);

    // Clear cookie to force re-login
    res.clearCookie('refreshToken', { path: '/' });
    sendSuccess(res, null, MESSAGES.AUTH.PASSWORD_CHANGED);
  }
}

export const authController = new AuthController();
