function addBillingCycle(date: Date, billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'): Date {
  const next = new Date(date);

  switch (billingCycle) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      return next;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      return next;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      return next;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      return next;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      return next;
  }
}

export function calculateNextBillingDate(
  startDate: Date,
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  now: Date = new Date()
): Date {
  let next = addBillingCycle(startDate, billingCycle);
  while (next.getTime() <= now.getTime()) {
    next = addBillingCycle(next, billingCycle);
  }
  return next;
}

export function calculateUpcomingBillingDate(
  anchorDate: Date,
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  now: Date = new Date()
): Date {
  let next = new Date(anchorDate);
  while (next.getTime() <= now.getTime()) {
    next = addBillingCycle(next, billingCycle);
  }
  return next;
}

export function normalizeMonthlyCost(
  price: number,
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
): number {
  const cycleDays: Record<string, number> = {
    DAILY: 30,
    WEEKLY: 30 / 7,
    MONTHLY: 1,
    QUARTERLY: 1 / 3,
    YEARLY: 1 / 12
  };

  return price * (cycleDays[billingCycle] || 1);
}

export function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}