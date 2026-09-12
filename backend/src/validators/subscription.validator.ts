import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['STREAMING', 'FITNESS', 'SAAS', 'GAMING', 'MUSIC', 'CLOUD_STORAGE', 'NEWS', 'EDUCATION', 'OTHER']),
  price: z.coerce.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 letters (e.g., USD)'),
  billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startAt: z
    .string()
    .optional()
    .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
      message: 'Invalid date format'
    }),
  startDate: z
    .string()
    .optional()
    .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
      message: 'Invalid date format'
    }),
  reminderDays: z.coerce.number().int().min(0).max(14).optional(),
  reminders: z
    .array(
      z.object({
        daysBefore: z.coerce.number().int().min(0).max(365),
        time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
        enabled: z.boolean().optional(),
      })
    )
    .optional(),
  customNotifications: z
    .array(
      z.object({
        notifyAt: z
          .string()
          .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date format' }),
        note: z.string().max(500, 'Notes can be at most 500 characters').optional(),
        enabled: z.boolean().optional(),
      })
    )
    .optional(),
  notes: z.string().max(500, 'Notes can be at most 500 characters').optional(),
  websiteUrl: z.string().url().optional()
});

export const updateSubscriptionSchema = createSubscriptionSchema
  .extend({
    startAt: z
      .union([
        z
          .string()
          .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date format' }),
        z.null(),
      ])
      .optional(),
  })
  .partial();
