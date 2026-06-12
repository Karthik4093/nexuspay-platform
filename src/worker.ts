import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { startPaymentWorker } from './workers/payment.worker';
import { startNotificationWorker } from './workers/notification.worker';
import { startScheduledWorker } from './workers/scheduler.worker';
import { startSchedulers } from './schedulers';
import { closeAllQueues } from './queues/bullmq';
import { config } from './config';
import { logger } from './utils/logger';

async function main() {
  const prisma = new PrismaClient();

  const paymentWorker = startPaymentWorker(prisma);
  const notificationWorker = startNotificationWorker(prisma);
  const { scheduledWorker, reportWorker, cleanupWorker, fraudWorker } = startScheduledWorker(prisma);
  const schedulers = startSchedulers(prisma);

  logger.info('🔧 NexusPay Worker Service started');
  logger.info(`  • Payment Worker (concurrency: ${config.QUEUE_CONCURRENCY})`);
  logger.info('  • Notification Worker');
  logger.info('  • Scheduled Workers');
  logger.info('  • Outbox Scheduler (every 5s)');

  const shutdown = async () => {
    logger.info('Shutting down workers...');
    schedulers.stop();
    await Promise.all([
      paymentWorker.close(),
      notificationWorker.close(),
      scheduledWorker.close(),
      reportWorker.close(),
      cleanupWorker.close(),
      fraudWorker.close(),
    ]);
    await closeAllQueues();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

main().catch((error) => {
  logger.error({ error }, 'Worker startup failed');
  process.exit(1);
});
