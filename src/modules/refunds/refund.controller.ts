import { FastifyRequest, FastifyReply } from 'fastify';
import { RefundService } from '../../services/refund.service';
import { successResponse } from '../../utils/response';
import { CreateRefundInput, RefundQueryInput } from '../../validators/refund.validators';
import { getPaginationParams } from '../../utils/pagination';
import { RefundStatus } from '@prisma/client';

export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  async create(request: FastifyRequest<{ Body: CreateRefundInput }>, reply: FastifyReply) {
    const merchantId = request.user!.merchantId ?? request.user!.sub;
    const refund = await this.refundService.create(merchantId, request.body, request.correlationId);
    successResponse(reply, refund, 201);
  }

  async getAll(request: FastifyRequest<{ Querystring: RefundQueryInput }>, reply: FastifyReply) {
    const pagination = getPaginationParams(request.query);
    const merchantId = request.user?.role === 'MERCHANT' ? request.user.merchantId : request.query.merchantId;
    const result = await this.refundService.getAll({
      ...pagination,
      merchantId,
      status: request.query.status as RefundStatus | undefined,
    });
    successResponse(reply, result.data, 200, result.meta);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const refund = await this.refundService.getById(request.params.id);
    successResponse(reply, refund);
  }
}
