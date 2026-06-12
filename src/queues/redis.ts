import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let client: Redis | null = null;

export function redisClient(): Redis {
  if (!client) {
    client = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD || undefined,
      db: config.REDIS_DB,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) return true;
        return false;
      },
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.error({ err }, 'Redis error'));
    client.on('close', () => logger.warn('Redis connection closed'));
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}

export async function setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
  await redisClient().setex(key, ttlSeconds, value);
}

export async function getFromRedis(key: string): Promise<string | null> {
  return redisClient().get(key);
}

export async function deleteFromRedis(key: string): Promise<void> {
  await redisClient().del(key);
}

export async function existsInRedis(key: string): Promise<boolean> {
  const result = await redisClient().exists(key);
  return result === 1;
}
