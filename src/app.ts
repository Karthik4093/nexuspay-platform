import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cookie from '@fastify/cookie';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { logger } from './utils/logger';
import { correlationPlugin } from './middleware/correlation';
import { errorHandlerPlugin } from './middleware/error-handler';
import { loggerPlugin } from './middleware/logger';
import { metricsPlugin } from './middleware/metrics';
import { authRoutes } from './modules/auth/auth.routes';
import { merchantRoutes } from './modules/merchants/merchant.routes';
import { customerRoutes } from './modules/customers/customer.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { refundRoutes } from './modules/refunds/refund.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { reportRoutes } from './modules/reports/report.routes';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: config.LOG_PRETTY
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
    trustProxy: true,
  });

  // Database
  const prisma = new PrismaClient({
    log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  // Core plugins
  await fastify.register(correlationPlugin);
  await fastify.register(loggerPlugin);

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await fastify.register(cors, {
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Idempotency-Key'],
  });

  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${context.after}`,
      },
      timestamp: new Date().toISOString(),
    }),
  });

  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_EXPIRES_IN },
  });

  await fastify.register(cookie);

  // Swagger
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'NexusPay Payment Orchestration API',
        description: 'Enterprise-grade Payment Orchestration Platform API',
        version: '1.0.0',
        contact: { name: 'NexusPay Support', email: 'support@nexuspay.com' },
        license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      },
      servers: [
        { url: `http://localhost:${config.PORT}`, description: 'Local Development' },
        { url: 'https://api.nexuspay.com', description: 'Production' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Merchants', description: 'Merchant management' },
        { name: 'Customers', description: 'Customer management' },
        { name: 'Payments', description: 'Payment processing' },
        { name: 'Refunds', description: 'Refund management' },
        { name: 'Audit', description: 'Audit logs' },
        { name: 'Notifications', description: 'Notification management' },
        { name: 'Reports', description: 'Report generation' },
        { name: 'Health', description: 'Health checks' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
  });

  // Error handler
  await fastify.register(errorHandlerPlugin);

  // Metrics
  await fastify.register(metricsPlugin);

  // Health check
  fastify.get('/health', {
    schema: { tags: ['Health'], summary: 'Health check' },
    handler: async (_req, reply) => {
      const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
      const status = dbOk ? 'healthy' : 'degraded';
      return reply.status(dbOk ? 200 : 503).send({
        success: dbOk,
        data: {
          status,
          service: config.SERVICE_NAME,
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          checks: { database: dbOk ? 'ok' : 'error' },
        },
        timestamp: new Date().toISOString(),
      });
    },
  });

  fastify.get('/ready', {
    schema: { tags: ['Health'], summary: 'Readiness check' },
    handler: async (_req, reply) => {
      return reply.send({
        success: true,
        data: { status: 'ready', timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });
    },
  });

  // API Routes
  const prefix = `/api/${config.API_VERSION}`;
  await fastify.register(authRoutes, { prefix });
  await fastify.register(merchantRoutes, { prefix });
  await fastify.register(customerRoutes, { prefix });
  await fastify.register(paymentRoutes, { prefix });
  await fastify.register(refundRoutes, { prefix });
  await fastify.register(auditRoutes, { prefix });
  await fastify.register(notificationRoutes, { prefix });
  await fastify.register(reportRoutes, { prefix });

  return fastify;
}
