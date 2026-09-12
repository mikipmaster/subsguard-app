// backend/src/models/Subscription.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: string;
  name: string;
  category: 'STREAMING' | 'FITNESS' | 'SAAS' | 'GAMING' | 'MUSIC' | 'CLOUD_STORAGE' | 'NEWS' | 'EDUCATION' | 'OTHER';
  price: number;
  currency: string;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startAt?: Date;
  startDate: Date;
  nextBillingDate: Date;
  status: 'ACTIVE' | 'CANCELLED' | 'PAUSED' | 'EXPIRED';
  reminderDays: number;
  reminders?: { daysBefore: number; time: string; enabled: boolean }[];
  customNotifications?: { notifyAt: Date; note?: string; enabled: boolean }[];
  notes?: string;
  logoUrl?: string;
  websiteUrl?: string;
  tags?: string[];
  lastNotifiedAt?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,  // ← ZMIENIONE Z ObjectId na String!
    required: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['STREAMING', 'FITNESS', 'SAAS', 'GAMING', 'MUSIC', 'CLOUD_STORAGE', 'NEWS', 'EDUCATION', 'OTHER'],
    default: 'OTHER' 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  currency: { 
    type: String, 
    required: true,
    uppercase: true,
    default: 'USD' 
  },
  billingCycle: { 
    type: String, 
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    required: true 
  },
  startAt: {
    type: Date,
  },
  startDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  nextBillingDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'CANCELLED', 'PAUSED', 'EXPIRED'],
    default: 'ACTIVE',
    index: true 
  },
  reminderDays: { 
    type: Number, 
    default: 3,
    min: 0,
    max: 14 
  },
  reminders: [
    {
      daysBefore: { type: Number, min: 0, max: 365, required: true },
      time: { type: String, required: true },
      enabled: { type: Boolean, default: true },
    },
  ],
  customNotifications: [
    {
      notifyAt: { type: Date, required: true },
      note: { type: String, trim: true, maxlength: 500 },
      enabled: { type: Boolean, default: true },
    },
  ],
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  logoUrl: String,
  websiteUrl: String,
  tags: [String],
  lastNotifiedAt: Date,
  cancelledAt: Date,
  pausedAt: Date
}, { 
  timestamps: true 
});

// Compound indexes
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, nextBillingDate: 1 });
SubscriptionSchema.index({ nextBillingDate: 1, status: 1 }); // For cron job

// Virtual for monthly cost (normalize to monthly)
SubscriptionSchema.virtual('monthlyCost').get(function() {
  const cycleDays: Record<string, number> = {
    DAILY: 30,
    WEEKLY: 30/7,
    MONTHLY: 1,
    QUARTERLY: 1/3,
    YEARLY: 1/12
  };
  return this.price * (cycleDays[this.billingCycle] || 1);
});

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
