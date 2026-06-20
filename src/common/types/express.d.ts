import { Role } from '@prisma/client';

// Augment Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        companyId: string;
        name: string;
      };
    }
  }
}

export {};
