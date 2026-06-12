import { Job } from 'bullmq';
import { PrismaClient, NotificationStatus } from '@prisma/client';
import { createWorker, QUEUE_NAMES } from '../queues/bullmq';
import { sendNotification } from '../integrations/python-services';
import { logger } from '../utils/logger';

interface NotificationJobData {
  notificationId: string;
  type: 'EMAIL' | 'SMS' | 'WEBHOOK';
  recipient: string;
  subject?: string;
  content: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export function startNotificationWorker(prisma: PrismaClient) {
  const worker = createWorker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATION,
    async (job: Job<NotificationJobData>) => {
      const { notificationId, type, recipient, subject, content, correlationId, metadata } = job.data;

      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT, attempts: { increment: 1 }, lastAttemptAt: new Date() },
      });

      try {
        await sendNotification({ type, recipient, subject, content, metadata }, correlationId);
        await prisma.notification.update({
          where: { id: notificationId },
          data: { status: NotificationStatus.DELIVERED, sentAt: new Date() },
        });
        logger.info({ notificationId, type }, 'Notification sent');
      } catch (error) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { status: NotificationStatus.FAILED },
        });
        throw error;
      }
    },
    { concurrency: 10 },
  );

  return worker;
}
