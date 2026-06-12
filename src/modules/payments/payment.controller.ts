import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../../services/payment.service';
import { successResponse } from '../../utils/response';
import { CreatePaymentInput, PaymentQueryInput, CancelPaymentInput } from '../../validators/payment.validators';
import { getPaginationParams } from '../../utils/pagination';
import { PaymentStatus } from '@prisma/client';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  async create(request: FastifyRequest<{ Body: CreatePaymentInput }>, reply: FastifyReply) {
    const merchantId = request.user!.merchantId ?? request.user!.sub;
    const payment = await this.paymentService.create(
      merchantId,
      request.body,
      request.correlationId,
    );
    successResponse(reply, payment, 201);
  }

  async getAll(request: FastifyRequest<{ Querystring: PaymentQueryInput }>, reply: FastifyReply) {
    const pagination = getPaginationParams(request.query);
    const merchantId = request.user?.role === 'MERCHANT' ? request.user.merchantId : request.query.merchantId;
    const result = await this.paymentService.getAll({
      ...pagination,
      merchantId,
      customerId: request.query.customerId,
      status: request.query.status as PaymentStatus | undefined,
      startDate: request.query.startDate,
      endDate: request.query.endDate,
    });
    successResponse(reply, result.data, 200, result.meta);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const payment = await this.paymentService.getById(request.params.id);
    successResponse(reply, payment);
  }

  async cancel(
    request: FastifyRequest<{ Params: { id: string }; Body: CancelPaymentInput }>,
    reply: FastifyReply,
  ) {
    const merchantId = request.user!.merchantId ?? request.user!.sub;
    const payment = await this.paymentService.cancel(
      request.params.id,
      merchantId,
      request.body.reason,
    );
    successResponse(reply, payment);
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    const merchantId = request.user?.role === 'MERCHANT' ? request.user.merchantId : undefined;
    const stats = await this.paymentService.getStats(merchantId);
    successResponse(reply, stats);
  }
}
