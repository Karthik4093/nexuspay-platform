import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, QUEUE_NAMES } from '../queues/bullmq';
import { logger } from '../utils/logger';

interface ScheduledJobData {
  triggeredAt?: string;
  date?: string;
  olderThan?: string;
}

export function startScheduledWorker(prisma: PrismaClient) {
  const scheduledWorker = createWorker<ScheduledJobData>(
    QUEUE_NAMES.SCHEDULED,
    async (job: Job<ScheduledJobData>) => {
      logger.info({ jobName: job.name, data: job.data }, 'Running scheduled job');

      switch (job.name) {
        case 'payment-reconciliation':
          await runPaymentReconciliation(prisma);
          break;
        case 'merchant-summary':
          await runMerchantSummary(prisma);
          break;
        case 'revenue-milestone-check':
          await runRevenueMilestoneCheck(prisma);
          break;
        default:
          logger.warn({ jobName: job.name }, 'Unknown scheduled job');
      }
    },
  );

  const reportWorker = createWorker<ScheduledJobData>(
    QUEUE_NAMES.REPORT_GENERATION,
    async (job: Job<ScheduledJobData>) => {
      logger.info({ jobName: job.name }, 'Generating report');
      await generateDailyReport(prisma, job.data.date ?? new Date().toISOString().split('T')[0]);
    },
  );

  const cleanupWorker = createWorker<ScheduledJobData>(
    QUEUE_NAMES.CLEANUP,
    async (job: Job<ScheduledJobData>) => {
      if (job.name === 'audit-cleanup' && job.data.olderThan) {
        await cleanupAuditLogs(prisma, new Date(job.data.olderThan));
      }
    },
  );

  const fraudWorker = createWorker<ScheduledJobData>(
    QUEUE_NAMES.FRAUD_CHECK,
    async (_job: Job<ScheduledJobData>) => {
      await runFraudThresholdScan(prisma);
    },
  );

  return { scheduledWorker, reportWorker, cleanupWorker, fraudWorker };
}

async function runPaymentReconciliation(prisma: PrismaClient) {
  const stalePayments = await prisma.payment.findMany({
    where: {
      status: 'PROCESSING',
      updatedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
    },
    take: 100,
  });

  for (const payment of stalePayments) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', errorCode: 'RECONCILIATION_TIMEOUT' },
    });
  }

  logger.info({ reconciled: stalePayments.length }, 'Payment reconciliation complete');
}

async function runMerchantSummary(prisma: PrismaClient) {
  const merchants = await prisma.merchant.findMany({ where: { status: 'ACTIVE', deletedAt: null } });
  for (const merchant of merchants) {
    const stats = await prisma.payment.aggregate({
      where: { merchantId: merchant.id, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
    });
    logger.info({ merchantId: merchant.id, volume: stats._sum.amount, count: stats._count }, 'Merchant summary');
  }
}

async function runRevenueMilestoneCheck(prisma: PrismaClient) {
  const totalRevenue = await prisma.payment.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true },
  });
  logger.info({ totalRevenue: totalRevenue._sum.amount }, 'Revenue milestone check');
}

async function generateDailyReport(prisma: PrismaClient, date: string) {
  const startDate = new Date(`${date}T00:00:00Z`);
  const endDate = new Date(`${date}T23:59:59Z`);
  const [payments, refunds] = await Promise.all([
    prisma.payment.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.refund.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
  ]);
  logger.info({ date, payments, refunds }, 'Daily report generated');
}

async function cleanupAuditLogs(prisma: PrismaClient, olderThan: Date) {
  const { count } = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: olderThan } },
  });
  logger.info({ deleted: count }, 'Audit log cleanup complete');
}

async function runFraudThresholdScan(prisma: PrismaClient) {
  const highFraudPayments = await prisma.payment.count({
    where: {
      fraudScore: { gte: 80 },
      status: 'SUCCESS',
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });
  if (highFraudPayments > 10) {
    logger.warn({ count: highFraudPayments }, 'ALERT: High fraud threshold exceeded');
  }
}
