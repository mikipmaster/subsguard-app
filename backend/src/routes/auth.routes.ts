import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', verifyAuth, authController.getMe);

export default router;
