import Subscription from '../models/Subscription.model';
import { calculateNextBillingDate, calculateUpcomingBillingDate, normalizeMonthlyCost } from '../utils/date.util';

export async function getAllSubscriptions(userId: string) {
  return await Subscription.find({ userId, status: { $ne: 'EXPIRED' } }).sort({ nextBillingDate: 1 });
}

export async function getSubscriptionById(id: string, userId: string) {
  const subscription = await Subscription.findOne({ _id: id, userId });
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  return subscription;
}

export async function createSubscription(userId: string, data: any) {
  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const nextBillingDate = calculateNextBillingDate(startDate, data.billingCycle);
  
  const subscription = await Subscription.create({
    userId,
    ...data,
    startDate,
    nextBillingDate
  });
  
  return subscription;
}

export async function updateSubscription(id: string, userId: string, data: any) {
  const subscription = await getSubscriptionById(id, userId);
  const prevNextBillingDate = subscription.nextBillingDate;
  
  Object.assign(subscription, data);
  
  const now = new Date();

  if (data.startDate) {
    subscription.startDate = new Date(data.startDate);
    subscription.nextBillingDate = calculateNextBillingDate(subscription.startDate, subscription.billingCycle, now);
  } else if (data.billingCycle) {
    const anchor = prevNextBillingDate && prevNextBillingDate.getTime() > now.getTime() ? prevNextBillingDate : subscription.startDate;
    subscription.nextBillingDate = calculateUpcomingBillingDate(anchor, subscription.billingCycle, now);
  }
  
  await subscription.save();
  return subscription;
}

export async function cancelSubscription(id: string, userId: string) {
  return await changeSubscriptionStatus(id, userId, 'CANCELLED');
}

export async function pauseSubscription(id: string, userId: string) {
  return await changeSubscriptionStatus(id, userId, 'PAUSED');
}

export async function getUpcomingSubscriptions(userId: string, days: number) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return await Subscription.find({
    userId,
    status: 'ACTIVE',
    nextBillingDate: {
      $gte: now,
      $lte: futureDate
    }
  }).sort({ nextBillingDate: 1 });
}

export async function getSubscriptionStats(userId: string) {
  const subscriptions = await Subscription.find({ userId, status: 'ACTIVE' });

  const activeCount = subscriptions.length;
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + normalizeMonthlyCost(sub.price, sub.billingCycle), 0);

  const categoryBreakdown = subscriptions.reduce((acc: Record<string, number>, sub: any) => {
    const key = String(sub.category ?? 'OTHER');
    const monthly = normalizeMonthlyCost(sub.price, sub.billingCycle);
    acc[key] = (acc[key] ?? 0) + monthly;
    return acc;
  }, {});

  const averageMonthly = activeCount > 0 ? totalMonthly / activeCount : 0;

  let cheapest: any = null;
  let mostExpensive: any = null;
  subscriptions.forEach((sub) => {
    const monthly = normalizeMonthlyCost(sub.price, sub.billingCycle);
    if (!cheapest || monthly < cheapest.monthlyCost) {
      cheapest = { subscription: sub, monthlyCost: monthly };
    }
    if (!mostExpensive || monthly > mostExpensive.monthlyCost) {
      mostExpensive = { subscription: sub, monthlyCost: monthly };
    }
  });

  return {
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalYearly: Math.round(totalMonthly * 12 * 100) / 100,
    activeCount,
    averageMonthly: Math.round(averageMonthly * 100) / 100,
    categoryBreakdown: Object.fromEntries(
      Object.entries(categoryBreakdown).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    cheapest: cheapest
      ? {
          id: cheapest.subscription._id,
          name: cheapest.subscription.name,
          monthlyCost: Math.round(cheapest.monthlyCost * 100) / 100
        }
      : null,
    mostExpensive: mostExpensive
      ? {
          id: mostExpensive.subscription._id,
          name: mostExpensive.subscription.name,
          monthlyCost: Math.round(mostExpensive.monthlyCost * 100) / 100
        }
      : null
  };
}

export async function deleteSubscription(id: string, userId: string) {
  const subscription = await getSubscriptionById(id, userId);
  await subscription.deleteOne();
}

export async function changeSubscriptionStatus(
  id: string,
  userId: string,
  status: 'ACTIVE' | 'CANCELLED' | 'PAUSED'
) {
  const subscription = await getSubscriptionById(id, userId);
  
  subscription.status = status;
  
  if (status === 'CANCELLED') {
    subscription.cancelledAt = new Date();
  } else if (status === 'PAUSED') {
    subscription.pausedAt = new Date();
  }
  
  await subscription.save();
  return subscription;
}
