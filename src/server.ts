import 'dotenv/config';
import { initTelemetry, shutdownTelemetry } from './telemetry';
import { buildApp } from './app';
import { connectRabbitMQ, closeRabbitMQ } from './queues/rabbitmq';
import { closeRedis, redisClient } from './queues/redis';
import { closeAllQueues } from './queues/bullmq';
import { config } from './config';
import { logger } from './utils/logger';

async function main() {
  initTelemetry();

  const app = await buildApp();

  // Connect to message broker
  try {
    await connectRabbitMQ();
  } catch (error) {
    logger.warn({ error }, 'RabbitMQ connection failed, continuing without message broker');
  }

  // Ping Redis
  try {
    await redisClient().ping();
    logger.info('Redis connected');
  } catch (error) {
    logger.warn({ error }, 'Redis connection failed, continuing without cache');
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    try {
      await app.close();
      await closeAllQueues();
      await closeRabbitMQ();
      await closeRedis();
      await shutdownTelemetry();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    process.exit(1);
  });

  await app.listen({ port: config.PORT, host: config.HOST });
  logger.info(`🚀 NexusPay API Gateway running on http://${config.HOST}:${config.PORT}`);
  logger.info(`📖 API Docs: http://localhost:${config.PORT}/api/docs`);
  logger.info(`📊 Metrics: http://localhost:${config.PORT}/metrics`);
}

main().catch((error) => {
  logger.error({ err: error?.message, stack: error?.stack }, 'Failed to start server');
  process.exit(1);
});
