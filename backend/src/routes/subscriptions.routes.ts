import { Router } from 'express';
import * as subscriptionsController from '../controllers/subscriptions.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../validators/subscription.validator';

const router = Router();

// ⚠️ TEMPORARY: Auth disabled for testing - enable later!
// router.use(verifyAuth);

router.get('/', subscriptionsController.getAll);
router.get('/stats', subscriptionsController.getStats);
router.get('/upcoming', subscriptionsController.getUpcoming);
router.get('/:id', subscriptionsController.getById);
router.post('/', validateRequest(createSubscriptionSchema), subscriptionsController.create);
router.post('/:id/cancel', subscriptionsController.cancel);
router.post('/:id/pause', subscriptionsController.pause);
router.patch('/:id', validateRequest(updateSubscriptionSchema), subscriptionsController.update);
router.delete('/:id', subscriptionsController.remove);
router.patch('/:id/status', subscriptionsController.changeStatus);

export default router;
