import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { RefundController } from './refund.controller';
import { RefundService } from '../../services/refund.service';
import { authenticate, requireMerchant } from '../../middleware/auth';

export async function refundRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const service = new RefundService(prisma);
  const controller = new RefundController(service);
  const p = options.prefix;

  fastify.post(`/refunds`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Refunds'], summary: 'Create a refund', security: [{ bearerAuth: [] }] },
    handler: controller.create.bind(controller),
  });

  fastify.get(`/refunds`, {
    preHandler: [authenticate],
    schema: { tags: ['Refunds'], summary: 'List refunds', security: [{ bearerAuth: [] }] },
    handler: controller.getAll.bind(controller),
  });

  fastify.get(`/refunds/:id`, {
    preHandler: [authenticate],
    schema: { tags: ['Refunds'], summary: 'Get refund by ID', security: [{ bearerAuth: [] }] },
    handler: controller.getById.bind(controller),
  });
}
