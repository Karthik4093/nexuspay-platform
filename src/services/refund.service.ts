import { PrismaClient, RefundStatus, PaymentStatus, AuditAction } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { buildPaginatedResult, PaginationParams } from '../utils/pagination';
import { CreateRefundInput } from '../validators/refund.validators';
import { logger } from '../utils/logger';

export class RefundService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(merchantId: string, input: CreateRefundInput, correlationId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment) throw new NotFoundError('Payment', input.paymentId);
    if (payment.merchantId !== merchantId) throw new ForbiddenError('Not authorized');
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new ValidationError(`Cannot refund payment in ${payment.status} status`);
    }

    const existingRefunds = await this.prisma.refund.aggregate({
      where: { paymentId: input.paymentId, status: { not: RefundStatus.REJECTED } },
      _sum: { amount: true },
    });

    const totalRefunded = Number(existingRefunds._sum.amount ?? 0);
    if (totalRefunded + input.amount > Number(payment.amount)) {
      throw new ValidationError('Refund amount exceeds payment amount');
    }

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          id: uuidv4(),
          paymentId: input.paymentId,
          merchantId,
          correlationId,
          amount: input.amount,
          reason: input.reason,
          status: RefundStatus.PENDING,
          metadata: input.metadata ?? {},
        },
      });

      await tx.auditLog.create({
        data: {
          id: uuidv4(),
          paymentId: input.paymentId,
          action: AuditAction.REFUND_INITIATED,
          resource: 'Refund',
          resourceId: refund.id,
          correlationId,
          newValue: { amount: input.amount, reason: input.reason },
        },
      });

      // Auto-approve for now (in production: manual review for large amounts)
      const updatedRefund = await tx.refund.update({
        where: { id: refund.id },
        data: { status: RefundStatus.COMPLETED, processedAt: new Date() },
      });

      // Update payment status if fully refunded
      if (totalRefunded + input.amount >= Number(payment.amount)) {
        await tx.payment.update({
          where: { id: input.paymentId },
          data: { status: PaymentStatus.REFUNDED },
        });
      }

      logger.info({ correlationId, refundId: refund.id, paymentId: input.paymentId }, 'Refund processed');
      return updatedRefund;
    });
  }

  async getById(id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!refund) throw new NotFoundError('Refund', id);
    return refund;
  }

  async getAll(params: PaginationParams & { merchantId?: string; status?: RefundStatus }) {
    const where = {
      ...(params.merchantId ? { merchantId: params.merchantId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: { payment: { select: { amount: true, currency: true } } },
      }),
      this.prisma.refund.count({ where }),
    ]);
    return buildPaginatedResult(data, total, params);
  }
}
