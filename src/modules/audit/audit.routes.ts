import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, requireSupport } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';

export async function auditRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const p = options.prefix;

  fastify.get(`/audit-logs`, {
    preHandler: [authenticate, requireSupport],
    schema: { tags: ['Audit'], summary: 'List audit logs', security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const { page, limit } = getPaginationParams(request.query as Record<string, string>);
      const query = request.query as { action?: string; resourceId?: string; startDate?: string; endDate?: string };
      const where = {
        ...(query.action ? { action: query.action as never } : {}),
        ...(query.resourceId ? { resourceId: query.resourceId } : {}),
        ...(query.startDate || query.endDate
          ? { createdAt: { gte: query.startDate ? new Date(query.startDate) : undefined, lte: query.endDate ? new Date(query.endDate) : undefined } }
          : {}),
      };
      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);
      successResponse(reply, data, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
    },
  });

  fastify.get(`/audit-logs/:id`, {
    preHandler: [authenticate, requireSupport],
    schema: { tags: ['Audit'], summary: 'Get audit log by ID', security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const log = await prisma.auditLog.findUnique({ where: { id } });
      if (!log) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Audit log not found' }, timestamp: new Date().toISOString() });
      successResponse(reply, log);
    },
  });
}
