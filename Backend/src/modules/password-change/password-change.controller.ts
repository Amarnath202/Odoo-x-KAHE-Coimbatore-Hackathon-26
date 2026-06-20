import { Request, Response } from 'express';
import { passwordChangeService } from './password-change.service';

export class PasswordChangeController {
  async createRequest(req: Request, res: Response) {
    const userId = req.user!.id;
    const { reason } = req.body;
    const request = await passwordChangeService.createRequest(userId, reason);
    res.status(201).json({ success: true, data: request });
  }

  async getMyRequests(req: Request, res: Response) {
    const userId = req.user!.id;
    const requests = await passwordChangeService.getMyRequests(userId);
    res.json({ success: true, data: requests });
  }

  async getAllRequests(req: Request, res: Response) {
    const requests = await passwordChangeService.getAllRequests();
    res.json({ success: true, data: requests });
  }

  async approveRequest(req: Request, res: Response) {
    const { id } = req.params;
    const request = await passwordChangeService.approveRequest(id);
    res.json({ success: true, data: request });
  }

  async rejectRequest(req: Request, res: Response) {
    const { id } = req.params;
    const request = await passwordChangeService.rejectRequest(id);
    res.json({ success: true, data: request });
  }

  async resetPassword(req: Request, res: Response) {
    const userId = req.user!.id;
    const { requestId, newPassword } = req.body;
    await passwordChangeService.resetPassword(userId, requestId, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  }
}

export const passwordChangeController = new PasswordChangeController();
