import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, QUEUE_NAMES } from '../queues/bullmq';
import { PaymentService } from '../services/payment.service';
import { logger } from '../utils/logger';

interface PaymentJobData {
  paymentId: string;
  merchantId: string;
  correlationId: string;
}

export function startPaymentWorker(prisma: PrismaClient) {
  const paymentService = new PaymentService(prisma);

  const worker = createWorker<PaymentJobData>(
    QUEUE_NAMES.PAYMENT_PROCESSING,
    async (job: Job<PaymentJobData>) => {
      const { paymentId, merchantId, correlationId } = job.data;
      logger.info({ jobId: job.id, paymentId, correlationId }, 'Processing payment job');
      await paymentService.processPayment(paymentId, merchantId, correlationId);
    },
    { concurrency: 5 },
  );

  return worker;
}
