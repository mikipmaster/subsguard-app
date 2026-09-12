import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.middleware';
import * as usersController from '../controllers/users.controller';

const router = Router();

router.post('/push-token', verifyAuth, usersController.setPushToken);

export default router;
