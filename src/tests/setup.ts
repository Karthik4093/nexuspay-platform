import { vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nexuspay_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-minimum-32-chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '4';
process.env.LOG_LEVEL = 'silent';

// Mock external services
vi.mock('../integrations/python-services', () => ({
  checkFraud: vi.fn().mockResolvedValue({
    score: 20,
    risk: 'LOW',
    recommendation: 'APPROVE',
    flags: [],
  }),
  calculateTax: vi.fn().mockResolvedValue({
    taxAmount: 10,
    taxRate: 0.1,
    netAmount: 90,
    breakdown: [{ type: 'VAT', rate: 0.1, amount: 10 }],
  }),
  convertCurrency: vi.fn().mockResolvedValue({
    convertedAmount: 100,
    rate: 1.0,
    fromCurrency: 'USD',
    toCurrency: 'USD',
    timestamp: new Date().toISOString(),
  }),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../queues/redis', () => ({
  redisClient: vi.fn().mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    ping: vi.fn().mockResolvedValue('PONG'),
  }),
  closeRedis: vi.fn(),
  setWithExpiry: vi.fn(),
  getFromRedis: vi.fn().mockResolvedValue(null),
  deleteFromRedis: vi.fn(),
  existsInRedis: vi.fn().mockResolvedValue(false),
}));

vi.mock('../queues/bullmq', () => ({
  addJob: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
  getQueue: vi.fn(),
  createWorker: vi.fn(),
  closeAllQueues: vi.fn(),
  QUEUE_NAMES: {
    PAYMENT_PROCESSING: 'payment-processing',
    NOTIFICATION: 'notification',
    REPORT_GENERATION: 'report-generation',
    OUTBOX_PUBLISHER: 'outbox-publisher',
    FRAUD_CHECK: 'fraud-check',
    AUDIT_LOG: 'audit-log',
    CLEANUP: 'cleanup',
    SCHEDULED: 'scheduled',
  },
}));

vi.mock('../queues/rabbitmq', () => ({
  connectRabbitMQ: vi.fn(),
  closeRabbitMQ: vi.fn(),
  publishEvent: vi.fn(),
  getChannel: vi.fn(),
  EXCHANGES: {},
  QUEUES: {},
}));
