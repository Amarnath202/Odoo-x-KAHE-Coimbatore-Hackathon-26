import { Router } from 'express';
import { passwordChangeController } from './password-change.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/rbac.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { Role } from '@prisma/client';
import { createRequestSchema, resetPasswordSchema } from './password-change.validator';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { idParamSchema } from '../../common/validators/common.validator';

const router = Router();
router.use(authenticate);

// User routes
router.post('/request', validate(createRequestSchema), asyncHandler(passwordChangeController.createRequest.bind(passwordChangeController)));
router.get('/my-requests', asyncHandler(passwordChangeController.getMyRequests.bind(passwordChangeController)));
router.post('/reset', validate(resetPasswordSchema), asyncHandler(passwordChangeController.resetPassword.bind(passwordChangeController)));

// Admin routes
const adminRouter = Router();
adminRouter.use(authenticate, authorize(Role.ADMIN, Role.BUSINESS_OWNER));
adminRouter.get('/', asyncHandler(passwordChangeController.getAllRequests.bind(passwordChangeController)));
adminRouter.put('/:id/approve', validate(idParamSchema, 'params'), asyncHandler(passwordChangeController.approveRequest.bind(passwordChangeController)));
adminRouter.put('/:id/reject', validate(idParamSchema, 'params'), asyncHandler(passwordChangeController.rejectRequest.bind(passwordChangeController)));

export const userPasswordChangeRoutes = router;
export const adminPasswordChangeRoutes = adminRouter;
