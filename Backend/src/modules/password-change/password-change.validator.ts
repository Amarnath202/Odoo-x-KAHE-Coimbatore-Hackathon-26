import { z } from 'zod';

export const createRequestSchema = z.object({
  reason: z.string().min(5, { message: 'Reason must be at least 5 characters long' }).max(500),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters' }),
  requestId: z.string().uuid({ message: 'Invalid request ID' }),
});
