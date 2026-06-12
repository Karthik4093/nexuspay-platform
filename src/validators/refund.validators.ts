import { z } from 'zod';

export const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().multipleOf(0.01),
  reason: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const refundQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED']).optional(),
  merchantId: z.string().uuid().optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type RefundQueryInput = z.infer<typeof refundQuerySchema>;
