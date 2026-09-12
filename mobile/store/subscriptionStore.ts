import { create } from 'zustand';
import api from '../services/api';

export interface Subscription {
  _id: string;
  userId: string;
  name: string;
  category: 'STREAMING' | 'FITNESS' | 'SAAS' | 'GAMING' | 'MUSIC' | 'CLOUD_STORAGE' | 'NEWS' | 'EDUCATION' | 'OTHER';
  price: number;
  currency: string;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startAt?: string | null;
  startDate: string;
  nextBillingDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAUSED' | 'EXPIRED';
  reminderDays: number;
  customNotifications?: { notifyAt: string; note?: string; enabled?: boolean }[];
  notes?: string;
  logoUrl?: string;
  websiteUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
  
  fetchSubscriptions: () => Promise<void>;
  addSubscription: (data: Partial<Subscription>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  getTotalMonthly: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  isLoading: false,

  fetchSubscriptions: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/subscriptions');
      const subscriptions = Array.isArray(data?.data) ? data.data : [];
      set({ subscriptions, isLoading: false });
    } catch (error) {
      console.error('Fetch subscriptions error:', error);
      set({ isLoading: false });
    }
  },

  addSubscription: async (subscriptionData) => {
    try {
      const { data } = await api.post('/subscriptions', subscriptionData);
      const created = data?.data;
      if (!created) {
        throw new Error('Failed to add subscription');
      }
      set((state) => ({
        subscriptions: [...state.subscriptions, created],
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to add subscription');
    }
  },

  updateSubscription: async (id, subscriptionData) => {
    try {
      const { data } = await api.patch(`/subscriptions/${id}`, subscriptionData);
      const updated = data?.data;
      if (!updated) {
        throw new Error('Failed to update subscription');
      }
      set((state) => ({
        subscriptions: state.subscriptions.map((sub) =>
          sub._id === id ? updated : sub
        ),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update subscription');
    }
  },

  deleteSubscription: async (id) => {
    const current = get().subscriptions;
    const toRemove = current.find((s) => s._id === id);

    set((state) => ({
      subscriptions: state.subscriptions.filter((sub) => sub._id !== id),
    }));

    try {
      await api.delete(`/subscriptions/${id}`);
    } catch (error: any) {
      if (toRemove) {
        set((state) => ({
          subscriptions: [toRemove, ...state.subscriptions],
        }));
      }
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to delete subscription');
    }
  },

  getTotalMonthly: () => {
    const subs = get().subscriptions.filter((s) => s.status === 'ACTIVE');
    return subs.reduce((total, sub) => {
      const cycleMultiplier: Record<string, number> = {
        DAILY: 30,
        WEEKLY: 30 / 7,
        MONTHLY: 1,
        QUARTERLY: 1 / 3,
        YEARLY: 1 / 12,
      };
      return total + sub.price * (cycleMultiplier[sub.billingCycle] || 1);
    }, 0);
  },
}));
