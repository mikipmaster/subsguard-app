import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.middleware';
import * as notificationsController from '../controllers/notifications.controller';

const router = Router();

router.post('/test', verifyAuth, notificationsController.sendTestPush);

export default router;
