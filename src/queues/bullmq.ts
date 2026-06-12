import { Queue, Worker, QueueEvents, Job, WorkerOptions } from 'bullmq';
import { redisClient } from './redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { queueJobsTotal } from '../middleware/metrics';

const connection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  db: config.REDIS_DB,
};

export const QUEUE_NAMES = {
  PAYMENT_PROCESSING: 'payment-processing',
  NOTIFICATION: 'notification',
  REPORT_GENERATION: 'report-generation',
  OUTBOX_PUBLISHER: 'outbox-publisher',
  FRAUD_CHECK: 'fraud-check',
  AUDIT_LOG: 'audit-log',
  CLEANUP: 'cleanup',
  SCHEDULED: 'scheduled',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: config.QUEUE_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export function createWorker<T = unknown>(
  name: QueueName,
  processor: (job: Job<T>) => Promise<void>,
  options?: Partial<WorkerOptions>,
): Worker<T> {
  const worker = new Worker<T>(name, processor, {
    connection,
    concurrency: config.QUEUE_CONCURRENCY,
    ...options,
  });

  worker.on('completed', (job) => {
    queueJobsTotal.inc({ queue: name, status: 'completed' });
    logger.debug({ queue: name, jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    queueJobsTotal.inc({ queue: name, status: 'failed' });
    logger.error({ queue: name, jobId: job?.id, error: err.message }, 'Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ queue: name, error: err.message }, 'Worker error');
  });

  return worker;
}

export async function addJob<T>(
  queueName: QueueName,
  jobName: string,
  data: T,
  options?: { delay?: number; priority?: number; jobId?: string },
): Promise<Job<T>> {
  const queue = getQueue(queueName);
  return queue.add(jobName, data, options);
}

export async function closeAllQueues(): Promise<void> {
  for (const [name, queue] of queues) {
    await queue.close();
    logger.debug({ queue: name }, 'Queue closed');
  }
  queues.clear();
}
