import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { processOutboxEvents } from '../workers/outbox.worker';
import { config } from '../config';
import { logger } from '../utils/logger';
import { addJob, QUEUE_NAMES } from '../queues/bullmq';

export function startSchedulers(prisma: PrismaClient) {
  // Outbox publisher - every 5 seconds
  const outboxJob = cron.schedule('*/5 * * * * *', async () => {
    try {
      await processOutboxEvents(prisma);
    } catch (error) {
      logger.error({ error }, 'Outbox processor error');
    }
  });

  // Payment reconciliation - hourly
  const reconciliationJob = cron.schedule(config.RECONCILIATION_CRON, async () => {
    logger.info('Running payment reconciliation');
    await addJob(QUEUE_NAMES.SCHEDULED, 'payment-reconciliation', { triggeredAt: new Date().toISOString() });
  });

  // Merchant summary - every 3 hours
  const merchantSummaryJob = cron.schedule(config.MERCHANT_SUMMARY_CRON, async () => {
    logger.info('Running merchant summary');
    await addJob(QUEUE_NAMES.SCHEDULED, 'merchant-summary', { triggeredAt: new Date().toISOString() });
  });

  // Daily report generation
  const dailyReportJob = cron.schedule(config.REPORT_GENERATION_CRON, async () => {
    logger.info('Running daily report generation');
    await addJob(QUEUE_NAMES.REPORT_GENERATION, 'daily-report', {
      date: new Date().toISOString().split('T')[0],
    });
  });

  // Weekly audit cleanup
  const auditCleanupJob = cron.schedule(config.AUDIT_CLEANUP_CRON, async () => {
    logger.info('Running audit log cleanup');
    await addJob(QUEUE_NAMES.CLEANUP, 'audit-cleanup', {
      olderThan: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  // Monthly archival
  const archivalJob = cron.schedule(config.ARCHIVAL_CRON, async () => {
    logger.info('Running monthly archival');
    await addJob(QUEUE_NAMES.CLEANUP, 'monthly-archival', { triggeredAt: new Date().toISOString() });
  });

  // Fraud threshold detection - every 15 minutes
  const fraudThresholdJob = cron.schedule('*/15 * * * *', async () => {
    await addJob(QUEUE_NAMES.FRAUD_CHECK, 'fraud-threshold-scan', { triggeredAt: new Date().toISOString() });
  });

  // Revenue milestone check - every hour
  const revenueMilestoneJob = cron.schedule('0 * * * *', async () => {
    await addJob(QUEUE_NAMES.SCHEDULED, 'revenue-milestone-check', { triggeredAt: new Date().toISOString() });
  });

  logger.info('Schedulers started');

  return {
    stop: () => {
      outboxJob.stop();
      reconciliationJob.stop();
      merchantSummaryJob.stop();
      dailyReportJob.stop();
      auditCleanupJob.stop();
      archivalJob.stop();
      fraudThresholdJob.stop();
      revenueMilestoneJob.stop();
      logger.info('Schedulers stopped');
    },
  };
}
