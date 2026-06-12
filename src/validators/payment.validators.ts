import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  currency: z.string().length(3).toUpperCase(),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'WALLET', 'UPI', 'CRYPTO']),
  customerId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(128),
  metadata: z.record(z.unknown()).optional(),
});

export const paymentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED']).optional(),
  merchantId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const cancelPaymentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
export type CancelPaymentInput = z.infer<typeof cancelPaymentSchema>;
