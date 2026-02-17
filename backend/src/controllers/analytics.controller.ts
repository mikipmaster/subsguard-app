import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Subscription from '../models/Subscription.model';
import { normalizeMonthlyCost } from '../utils/date.util';

export async function getSummary(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    
    const subscriptions = await Subscription.find({ userId, status: 'ACTIVE' });
    
    // Calculate totals
    let totalMonthly = 0;
    const categoryBreakdown: Record<string, number> = {};
    
    subscriptions.forEach(sub => {
      const monthlyCost = normalizeMonthlyCost(sub.price, sub.billingCycle);
      totalMonthly += monthlyCost;
      
      if (!categoryBreakdown[sub.category]) {
        categoryBreakdown[sub.category] = 0;
      }
      categoryBreakdown[sub.category] += monthlyCost;
    });
    
    const totalYearly = totalMonthly * 12;
    const activeCount = subscriptions.length;
    const avgPerMonth = activeCount > 0 ? totalMonthly / activeCount : 0;
    
    res.json({
      data: {
        totalMonthly: Math.round(totalMonthly * 100) / 100,
        totalYearly: Math.round(totalYearly * 100) / 100,
        activeSubscriptions: activeCount,
        avgPerSubscription: Math.round(avgPerMonth * 100) / 100,
        categoryBreakdown
      },
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

export async function getTrends(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const months = parseInt(req.query.months as string) || 6;
    
    const subscriptions = await Subscription.find({ userId, status: 'ACTIVE' });
    
    // Generate monthly data
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().substring(0, 7); // YYYY-MM
      
      let total = 0;
      subscriptions.forEach(sub => {
        if (new Date(sub.startDate) <= date) {
          total += normalizeMonthlyCost(sub.price, sub.billingCycle);
        }
      });
      
      trends.push({
        month: monthStr,
        total: Math.round(total * 100) / 100
      });
    }
    
    res.json({
      data: trends,
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
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const upcoming = await Subscription.find({
      userId,
      status: 'ACTIVE',
      nextBillingDate: {
        $gte: now,
        $lte: futureDate
      }
    }).sort({ nextBillingDate: 1 });
    
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

export async function getSpendingByCategory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const subscriptions = await Subscription.find({ userId, status: 'ACTIVE' });

    const categoryBreakdown: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const monthlyCost = normalizeMonthlyCost(sub.price, sub.billingCycle);
      categoryBreakdown[sub.category] = (categoryBreakdown[sub.category] || 0) + monthlyCost;
    });

    const data = Object.entries(categoryBreakdown)
      .map(([category, monthlyTotal]) => ({
        category,
        monthlyTotal: Math.round(monthlyTotal * 100) / 100,
        yearlyTotal: Math.round(monthlyTotal * 12 * 100) / 100
      }))
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    res.json({
      data,
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

export async function getUpcomingPayments(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const upcoming = await Subscription.find({
      userId,
      status: 'ACTIVE',
      nextBillingDate: {
        $gte: now,
        $lte: futureDate
      }
    }).sort({ nextBillingDate: 1 });

    const data = upcoming.map((sub) => ({
      id: sub._id,
      name: sub.name,
      category: sub.category,
      price: sub.price,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextBillingDate: sub.nextBillingDate
    }));

    res.json({
      data,
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
