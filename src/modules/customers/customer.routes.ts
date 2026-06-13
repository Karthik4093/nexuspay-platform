import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { CustomerController } from './customer.controller';
import { CustomerService } from '../../services/customer.service';
import { authenticate, requireMerchant, requireAdmin } from '../../middleware/auth';

export async function customerRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const service = new CustomerService(prisma);
  const controller = new CustomerController(service);
  const p = options.prefix;

  fastify.post(`/merchants/:merchantId/customers`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Customers'], summary: 'Create customer for merchant', security: [{ bearerAuth: [] }] },
    handler: controller.create.bind(controller),
  });

  fastify.get(`/customers`, {
    preHandler: [authenticate],
    schema: { tags: ['Customers'], summary: 'List customers', security: [{ bearerAuth: [] }] },
    handler: controller.getAll.bind(controller),
  });

  fastify.get(`/customers/:id`, {
    preHandler: [authenticate],
    schema: { tags: ['Customers'], summary: 'Get customer by ID', security: [{ bearerAuth: [] }] },
    handler: controller.getById.bind(controller),
  });

  fastify.patch(`/customers/:id`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Customers'], summary: 'Update customer', security: [{ bearerAuth: [] }] },
    handler: controller.update.bind(controller),
  });

  fastify.delete(`/customers/:id`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Customers'], summary: 'Delete customer', security: [{ bearerAuth: [] }] },
    handler: controller.delete.bind(controller),
  });
}
