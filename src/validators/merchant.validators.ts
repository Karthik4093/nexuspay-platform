import { z } from 'zod';

export const createMerchantSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  businessType: z.string().optional(),
  country: z.string().length(2).default('US'),
  currency: z.string().length(3).default('USD'),
  timezone: z.string().default('UTC'),
  webhookUrl: z.string().url().optional(),
});

export const updateMerchantSchema = createMerchantSchema.partial().extend({
  webhookUrl: z.string().url().optional().nullable(),
});

export const merchantQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
  search: z.string().optional(),
});

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type UpdateMerchantInput = z.infer<typeof updateMerchantSchema>;
export type MerchantQueryInput = z.infer<typeof merchantQuerySchema>;
