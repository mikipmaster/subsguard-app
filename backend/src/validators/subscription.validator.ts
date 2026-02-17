import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['STREAMING', 'FITNESS', 'SAAS', 'GAMING', 'MUSIC', 'CLOUD_STORAGE', 'NEWS', 'EDUCATION', 'OTHER']),
  price: z.coerce.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 letters (e.g., USD)'),
  billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z
    .string()
    .optional()
    .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
      message: 'Invalid date format'
    }),
  reminderDays: z.coerce.number().int().min(0).max(14).optional(),
  notes: z.string().optional(),
  websiteUrl: z.string().url().optional()
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();
