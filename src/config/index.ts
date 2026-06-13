import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  API_VERSION: z.string().default('v1'),
  SERVICE_NAME: z.string().default('nexuspay-api-gateway'),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  RABBITMQ_URL: z.string().default('amqp://guest:guest@localhost:5672'),
  RABBITMQ_EXCHANGE: z.string().default('nexuspay.events'),
  RABBITMQ_VHOST: z.string().default('/'),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_ROUNDS: z.coerce.number().default(12),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),

  CORS_ORIGIN: z.string().default('http://localhost:8080'),

  FRAUD_SERVICE_URL: z.string().url().default('http://localhost:8001'),
  CURRENCY_SERVICE_URL: z.string().url().default('http://localhost:8002'),
  TAX_SERVICE_URL: z.string().url().default('http://localhost:8003'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:8004'),
  REPORT_SERVICE_URL: z.string().url().default('http://localhost:8005'),
  ANALYTICS_SERVICE_URL: z.string().url().default('http://localhost:8006'),
  RECOMMENDATION_SERVICE_URL: z.string().url().default('http://localhost:8007'),
  INVENTORY_SERVICE_URL: z.string().url().default('http://localhost:8008'),
  DOCUMENT_SERVICE_URL: z.string().url().default('http://localhost:8009'),
  AI_SCORING_SERVICE_URL: z.string().url().default('http://localhost:8010'),

  CIRCUIT_BREAKER_TIMEOUT: z.coerce.number().default(3000),
  CIRCUIT_BREAKER_ERROR_THRESHOLD: z.coerce.number().default(50),
  CIRCUIT_BREAKER_RESET_TIMEOUT: z.coerce.number().default(30000),

  OTEL_ENABLED: z.string().transform(v => v === 'true').default('false'),
  OTEL_SERVICE_NAME: z.string().default('nexuspay-api-gateway'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),
  JAEGER_ENDPOINT: z.string().default('http://localhost:14268/api/traces'),

  METRICS_PORT: z.coerce.number().default(9091),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.string().transform(v => v === 'true').default('false'),

  QUEUE_CONCURRENCY: z.coerce.number().default(5),
  QUEUE_ATTEMPTS: z.coerce.number().default(3),

  FRONTEND_URL: z.string().default('http://localhost:8080'),
  IDEMPOTENCY_KEY_TTL: z.coerce.number().default(86400),

  RECONCILIATION_CRON: z.string().default('0 * * * *'),
  MERCHANT_SUMMARY_CRON: z.string().default('0 */3 * * *'),
  REPORT_GENERATION_CRON: z.string().default('0 0 * * *'),
  AUDIT_CLEANUP_CRON: z.string().default('0 0 * * 0'),
  ARCHIVAL_CRON: z.string().default('0 0 1 * *'),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('❌ Invalid environment variables:', JSON.stringify(errors, null, 2));
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
