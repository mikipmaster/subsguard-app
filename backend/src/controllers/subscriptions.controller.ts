import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as subscriptionService from '../services/subscription.service';

// ⚠️ TEMPORARY: Hardcoded user ID for testing (valid MongoDB ObjectId)
const TEST_USER_ID = '507f1f77bcf86cd799439011';

void TEST_USER_ID;

export async function getAll(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const subscriptions = await subscriptionService.getAllSubscriptions(userId);
    res.json({
      data: subscriptions,
      error: null,
      message: null
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const subscription = await subscriptionService.getSubscriptionById(id, userId);
    res.json({
      data: subscription,
      error: null,
      message: null
    });
  } catch (error: any) {
    res.status(404).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const subscription = await subscriptionService.createSubscription(userId, req.body);
    res.status(201).json({
      data: subscription,
      error: null,
      message: 'Subscription created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const subscription = await subscriptionService.updateSubscription(id, userId, req.body);
    res.json({
      data: subscription,
      error: null,
      message: 'Subscription updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    await subscriptionService.deleteSubscription(id, userId);
    res.json({
      data: null,
      error: null,
      message: 'Subscription deleted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function changeStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const subscription = await subscriptionService.changeSubscriptionStatus(id, userId, status);
    res.json({
      data: subscription,
      error: null,
      message: 'Status updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function cancel(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const subscription = await subscriptionService.cancelSubscription(id, userId);
    res.json({
      data: subscription,
      error: null,
      message: 'Subscription cancelled successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function pause(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const subscription = await subscriptionService.pauseSubscription(id, userId);
    res.json({
      data: subscription,
      error: null,
      message: 'Subscription paused successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function getStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const stats = await subscriptionService.getSubscriptionStats(userId);
    res.json({
      data: stats,
      error: null,
      message: null
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}

export async function getUpcoming(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }
    const days = parseInt(req.query.days as string) || 30;
    const upcoming = await subscriptionService.getUpcomingSubscriptions(userId, days);
    res.json({
      data: upcoming,
      error: null,
      message: null
    });
  } catch (error: any) {
    res.status(400).json({
      data: null,
      error: { message: error.message },
      message: error.message
    });
  }
}
