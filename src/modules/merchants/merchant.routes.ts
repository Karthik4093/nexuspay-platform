import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MerchantController } from './merchant.controller';
import { MerchantService } from '../../services/merchant.service';
import { authenticate, requireAdmin, requireMerchant } from '../../middleware/auth';
import { createMerchantSchema, updateMerchantSchema, merchantQuerySchema } from '../../validators/merchant.validators';

export async function merchantRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const service = new MerchantService(prisma);
  const controller = new MerchantController(service);
  const p = options.prefix;

  fastify.post(`/merchants`, {
    preHandler: [authenticate, requireAdmin],
    schema: { tags: ['Merchants'], summary: 'Create merchant', security: [{ bearerAuth: [] }] },
    handler: controller.create.bind(controller),
  });

  fastify.get(`/merchants`, {
    preHandler: [authenticate, requireAdmin],
    schema: { tags: ['Merchants'], summary: 'List all merchants', security: [{ bearerAuth: [] }] },
    handler: controller.getAll.bind(controller),
  });

  fastify.get(`/merchants/:id`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Merchants'], summary: 'Get merchant by ID', security: [{ bearerAuth: [] }] },
    handler: controller.getById.bind(controller),
  });

  fastify.patch(`/merchants/:id`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Merchants'], summary: 'Update merchant', security: [{ bearerAuth: [] }] },
    handler: controller.update.bind(controller),
  });

  fastify.post(`/merchants/:id/activate`, {
    preHandler: [authenticate, requireAdmin],
    schema: { tags: ['Merchants'], summary: 'Activate merchant', security: [{ bearerAuth: [] }] },
    handler: controller.activate.bind(controller),
  });

  fastify.post(`/merchants/:id/suspend`, {
    preHandler: [authenticate, requireAdmin],
    schema: { tags: ['Merchants'], summary: 'Suspend merchant', security: [{ bearerAuth: [] }] },
    handler: controller.suspend.bind(controller),
  });

  fastify.post(`/merchants/:id/rotate-keys`, {
    preHandler: [authenticate, requireAdmin],
    schema: { tags: ['Merchants'], summary: 'Rotate API keys', security: [{ bearerAuth: [] }] },
    handler: controller.rotateKeys.bind(controller),
  });

  fastify.delete(`/merchants/:id`, {
    preHandler: [authenticate, requireAdmin],
    schema: { tags: ['Merchants'], summary: 'Delete merchant', security: [{ bearerAuth: [] }] },
    handler: controller.delete.bind(controller),
  });
}
