import amqplib, { Connection, Channel, Options } from 'amqplib';
import { config } from '../config';
import { logger } from '../utils/logger';

const EXCHANGES = {
  PAYMENT_EVENTS: 'nexuspay.payment.events',
  NOTIFICATION_EVENTS: 'nexuspay.notification.events',
  AUDIT_EVENTS: 'nexuspay.audit.events',
  DEAD_LETTER: 'nexuspay.dead.letter',
} as const;

const QUEUES = {
  PAYMENT_CREATED: 'nexuspay.payment.created',
  PAYMENT_PROCESS: 'nexuspay.payment.process',
  NOTIFICATION_EMAIL: 'nexuspay.notification.email',
  NOTIFICATION_WEBHOOK: 'nexuspay.notification.webhook',
  AUDIT_LOG: 'nexuspay.audit.log',
  OUTBOX_PUBLISHER: 'nexuspay.outbox.publisher',
  DEAD_LETTER: 'nexuspay.dead.letter',
} as const;

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  try {
    connection = await amqplib.connect(config.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGES.PAYMENT_EVENTS, 'topic', { durable: true });
    await channel.assertExchange(EXCHANGES.NOTIFICATION_EVENTS, 'topic', { durable: true });
    await channel.assertExchange(EXCHANGES.AUDIT_EVENTS, 'topic', { durable: true });
    await channel.assertExchange(EXCHANGES.DEAD_LETTER, 'fanout', { durable: true });

    const dlqOptions: Options.AssertQueue = { durable: true };
    await channel.assertQueue(QUEUES.DEAD_LETTER, dlqOptions);
    await channel.bindQueue(QUEUES.DEAD_LETTER, EXCHANGES.DEAD_LETTER, '');

    const queueOptions: Options.AssertQueue = {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
        'x-message-ttl': 3600000,
      },
    };

    await channel.assertQueue(QUEUES.PAYMENT_CREATED, queueOptions);
    await channel.assertQueue(QUEUES.PAYMENT_PROCESS, queueOptions);
    await channel.assertQueue(QUEUES.NOTIFICATION_EMAIL, queueOptions);
    await channel.assertQueue(QUEUES.NOTIFICATION_WEBHOOK, queueOptions);
    await channel.assertQueue(QUEUES.AUDIT_LOG, queueOptions);
    await channel.assertQueue(QUEUES.OUTBOX_PUBLISHER, queueOptions);

    await channel.bindQueue(QUEUES.PAYMENT_CREATED, EXCHANGES.PAYMENT_EVENTS, 'payment.created');
    await channel.bindQueue(QUEUES.PAYMENT_PROCESS, EXCHANGES.PAYMENT_EVENTS, 'payment.process.*');
    await channel.bindQueue(QUEUES.NOTIFICATION_EMAIL, EXCHANGES.NOTIFICATION_EVENTS, 'notification.email');
    await channel.bindQueue(QUEUES.NOTIFICATION_WEBHOOK, EXCHANGES.NOTIFICATION_EVENTS, 'notification.webhook');
    await channel.bindQueue(QUEUES.AUDIT_LOG, EXCHANGES.AUDIT_EVENTS, 'audit.*');

    await channel.prefetch(10);

    connection.on('error', (err) => {
      logger.error({ err }, 'RabbitMQ connection error');
      void reconnect();
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed, reconnecting...');
      void reconnect();
    });

    logger.info('RabbitMQ connected and configured');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to RabbitMQ');
    throw error;
  }
}

async function reconnect(): Promise<void> {
  connection = null;
  channel = null;
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await connectRabbitMQ();
}

export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
}

export async function publishEvent(
  exchange: string,
  routingKey: string,
  payload: unknown,
  correlationId?: string,
): Promise<void> {
  const ch = getChannel();
  const message = Buffer.from(JSON.stringify(payload));
  ch.publish(exchange, routingKey, message, {
    persistent: true,
    contentType: 'application/json',
    correlationId,
    timestamp: Date.now(),
  });
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}

export { EXCHANGES, QUEUES };
