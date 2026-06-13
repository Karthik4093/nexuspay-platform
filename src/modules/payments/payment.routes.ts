import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { PaymentService } from '../../services/payment.service';
import { authenticate, requireMerchant } from '../../middleware/auth';

export async function paymentRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const service = new PaymentService(prisma);
  const controller = new PaymentController(service);
  const p = options.prefix;

  fastify.post(`/payments`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Payments'], summary: 'Create a payment', security: [{ bearerAuth: [] }] },
    handler: controller.create.bind(controller),
  });

  fastify.get(`/payments`, {
    preHandler: [authenticate],
    schema: { tags: ['Payments'], summary: 'List payments', security: [{ bearerAuth: [] }] },
    handler: controller.getAll.bind(controller),
  });

  fastify.get(`/payments/stats`, {
    preHandler: [authenticate],
    schema: { tags: ['Payments'], summary: 'Payment statistics', security: [{ bearerAuth: [] }] },
    handler: controller.getStats.bind(controller),
  });

  fastify.get(`/payments/:id`, {
    preHandler: [authenticate],
    schema: { tags: ['Payments'], summary: 'Get payment by ID', security: [{ bearerAuth: [] }] },
    handler: controller.getById.bind(controller),
  });

  fastify.post(`/payments/:id/cancel`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Payments'], summary: 'Cancel a payment', security: [{ bearerAuth: [] }] },
    handler: controller.cancel.bind(controller),
  });
}
