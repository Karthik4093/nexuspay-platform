import { PrismaClient, OutboxStatus } from '@prisma/client';
import { publishEvent, EXCHANGES } from '../queues/rabbitmq';
import { logger } from '../utils/logger';

const BATCH_SIZE = 50;

export async function processOutboxEvents(prisma: PrismaClient): Promise<void> {
  const events = await prisma.outboxEvent.findMany({
    where: { status: OutboxStatus.PENDING },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  if (events.length === 0) return;

  logger.debug({ count: events.length }, 'Processing outbox events');

  for (const event of events) {
    try {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: OutboxStatus.PROCESSING, lastAttemptAt: new Date(), attempts: { increment: 1 } },
      });

      const exchange = getExchangeForEvent(event.eventType);
      await publishEvent(exchange, event.eventType, event.payload, event.correlationId ?? undefined);

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: OutboxStatus.PUBLISHED, publishedAt: new Date() },
      });
    } catch (error) {
      logger.error({ eventId: event.id, error }, 'Failed to publish outbox event');
      const maxAttempts = 5;
      const newStatus = event.attempts + 1 >= maxAttempts ? OutboxStatus.FAILED : OutboxStatus.PENDING;
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: newStatus,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

function getExchangeForEvent(eventType: string): string {
  if (eventType.startsWith('payment.')) return EXCHANGES.PAYMENT_EVENTS;
  if (eventType.startsWith('notification.')) return EXCHANGES.NOTIFICATION_EVENTS;
  if (eventType.startsWith('audit.')) return EXCHANGES.AUDIT_EVENTS;
  return EXCHANGES.PAYMENT_EVENTS;
}
