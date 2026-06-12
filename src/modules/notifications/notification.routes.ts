import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';

export async function notificationRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const p = options.prefix;

  fastify.get(`${p}/notifications`, {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], summary: 'List notifications', security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const { page, limit } = getPaginationParams(request.query as Record<string, string>);
      const merchantId = request.user?.role === 'MERCHANT' ? request.user.merchantId : undefined;
      const where = merchantId ? { merchantId } : {};
      const [data, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where }),
      ]);
      successResponse(reply, data, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
    },
  });
}
