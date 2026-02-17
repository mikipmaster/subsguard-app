import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller';
import { verifyAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/create-checkout', verifyAuth, paymentsController.createCheckout);
router.post('/webhook', paymentsController.handleWebhook);
router.get('/portal', verifyAuth, paymentsController.getPortal);

export default router;
    