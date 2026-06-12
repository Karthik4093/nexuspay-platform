import { FastifyInstance } from 'fastify';
import { PrismaClient, ReportType, ReportStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireMerchant } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';

export async function reportRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const p = options.prefix;

  fastify.post(`${p}/reports`, {
    preHandler: [authenticate, requireMerchant],
    schema: { tags: ['Reports'], summary: 'Generate a report', security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const body = request.body as { type: string; startDate: string; endDate: string; parameters?: Record<string, unknown> };
      const merchantId = request.user!.merchantId;
      const report = await prisma.report.create({
        data: {
          id: uuidv4(),
          merchantId,
          type: body.type as ReportType,
          status: ReportStatus.PENDING,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          parameters: body.parameters ?? {},
        },
      });
      successResponse(reply, report, 201);
    },
  });

  fastify.get(`${p}/reports`, {
    preHandler: [authenticate],
    schema: { tags: ['Reports'], summary: 'List reports', security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const { page, limit } = getPaginationParams(request.query as Record<string, string>);
      const merchantId = request.user?.role === 'MERCHANT' ? request.user.merchantId : undefined;
      const where = merchantId ? { merchantId } : {};
      const [data, total] = await Promise.all([
        prisma.report.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.report.count({ where }),
      ]);
      successResponse(reply, data, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
    },
  });

  fastify.get(`${p}/reports/:id`, {
    preHandler: [authenticate],
    schema: { tags: ['Reports'], summary: 'Get report by ID', security: [{ bearerAuth: [] }] },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const report = await prisma.report.findUnique({ where: { id } });
      if (!report) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' }, timestamp: new Date().toISOString() });
      successResponse(reply, report);
    },
  });
}
