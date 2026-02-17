import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { verifyAuth } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.use(verifyAuth);

router.get('/summary', analyticsController.getSummary);
router.get('/trends', analyticsController.getTrends);
router.get('/upcoming', analyticsController.getUpcoming);

router.get('/spending-by-category', analyticsController.getSpendingByCategory);
router.get('/upcoming-payments', analyticsController.getUpcomingPayments);

export default router;
