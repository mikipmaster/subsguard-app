export function calculateNextBillingDate(
    startDate: Date,
    billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  ): Date {
    const next = new Date(startDate);
    
    switch (billingCycle) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
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
  