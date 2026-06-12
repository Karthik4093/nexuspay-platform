import { PrismaClient, PaymentStatus, OutboxStatus, AuditAction } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PaymentRepository } from '../repositories/payment.repository';
import { hashSHA256 } from '../utils/crypto';
import { NotFoundError, IdempotencyError, ForbiddenError } from '../utils/errors';
import { buildPaginatedResult, PaginationParams } from '../utils/pagination';
import { CreatePaymentInput, PaymentQueryInput } from '../validators/payment.validators';
import { checkFraud, calculateTax, convertCurrency } from '../integrations/python-services';
import { addJob, QUEUE_NAMES } from '../queues/bullmq';
import { logger } from '../utils/logger';
import { paymentsCreated } from '../middleware/metrics';

export class PaymentService {
  private repo: PaymentRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new PaymentRepository(prisma);
  }

  async create(merchantId: string, input: CreatePaymentInput, correlationId: string) {
    const requestHash = hashSHA256(JSON.stringify({ merchantId, ...input }));

    // Check idempotency
    const existingKey = await this.prisma.idempotencyKey.findUnique({
      where: { key: input.idempotencyKey },
    });

    if (existingKey) {
      const existingPayment = await this.repo.findByIdempotencyKey(existingKey.id);
      if (existingPayment) {
        logger.info({ correlationId, paymentId: existingPayment.id }, 'Idempotent payment request');
        return existingPayment;
      }
    }

    // Transactional: create idempotency key + payment + outbox event
    const payment = await this.prisma.$transaction(async (tx) => {
      const idempotencyKey = await tx.idempotencyKey.upsert({
        where: { key: input.idempotencyKey },
        create: {
          id: uuidv4(),
          key: input.idempotencyKey,
          merchantId,
          requestHash,
          expiresAt: new Date(Date.now() + 86400 * 1000),
        },
        update: {},
      });

      const newPayment = await this.repo.create(
        {
          merchantId,
          customerId: input.customerId,
          idempotencyKeyId: idempotencyKey.id,
          correlationId,
          amount: input.amount,
          currency: input.currency,
          paymentMethod: input.paymentMethod,
          description: input.description,
          metadata: input.metadata as Record<string, unknown>,
        },
        tx,
      );

      // Outbox event
      await tx.outboxEvent.create({
        data: {
          id: uuidv4(),
          aggregateId: newPayment.id,
          aggregateType: 'Payment',
          eventType: 'payment.created',
          payload: {
            paymentId: newPayment.id,
            merchantId,
            amount: input.amount,
            currency: input.currency,
            correlationId,
          },
          correlationId,
          status: OutboxStatus.PENDING,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          id: uuidv4(),
          paymentId: newPayment.id,
          action: AuditAction.PAYMENT_CREATED,
          resource: 'Payment',
          resourceId: newPayment.id,
          correlationId,
          newValue: { amount: input.amount, currency: input.currency, status: 'PENDING' },
        },
      });

      return newPayment;
    });

    paymentsCreated.inc({ status: 'created', currency: input.currency, method: input.paymentMethod });

    // Queue for processing
    await addJob(QUEUE_NAMES.PAYMENT_PROCESSING, 'process-payment', {
      paymentId: payment.id,
      merchantId,
      correlationId,
    });

    logger.info({ correlationId, paymentId: payment.id }, 'Payment created and queued');
    return payment;
  }

  async processPayment(paymentId: string, merchantId: string, correlationId: string): Promise<void> {
    const payment = await this.repo.findById(paymentId);
    if (!payment) return;

    await this.repo.updateStatus(paymentId, PaymentStatus.PROCESSING);

    try {
      // Step 1: Fraud check
      const fraud = await checkFraud({
        paymentId,
        amount: Number(payment.amount),
        currency: payment.currency,
        customerId: payment.customerId ?? undefined,
        merchantId,
        metadata: payment.metadata as Record<string, unknown>,
      }, correlationId);

      if (fraud.recommendation === 'REJECT') {
        await this.repo.updateStatus(paymentId, PaymentStatus.FAILED, {
          fraudScore: fraud.score,
          errorCode: 'FRAUD_REJECTED',
          errorMessage: `Payment rejected by fraud detection: ${fraud.flags.join(', ')}`,
        });
        return;
      }

      // Step 2: Tax calculation
      const tax = await calculateTax({
        amount: Number(payment.amount),
        currency: payment.currency,
        country: 'US',
        merchantId,
      }, correlationId);

      // Step 3: Currency conversion (if needed)
      let convertedAmount = Number(payment.amount);
      let convertedCurrency = payment.currency;
      if (payment.currency !== 'USD') {
        const converted = await convertCurrency({
          amount: Number(payment.amount),
          fromCurrency: payment.currency,
          toCurrency: 'USD',
        }, correlationId);
        convertedAmount = converted.convertedAmount;
        convertedCurrency = 'USD';
      }

      // Step 4: Mark as successful
      await this.prisma.$transaction(async (tx) => {
        await this.repo.updateStatus(
          paymentId,
          PaymentStatus.SUCCESS,
          {
            fraudScore: fraud.score,
            taxAmount: tax.taxAmount,
            netAmount: tax.netAmount,
            convertedAmount,
            convertedCurrency,
            processorRef: `proc_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
          },
          tx,
        );

        await tx.auditLog.create({
          data: {
            id: uuidv4(),
            paymentId,
            action: AuditAction.PAYMENT_PROCESSED,
            resource: 'Payment',
            resourceId: paymentId,
            correlationId,
            newValue: { status: 'SUCCESS', fraudScore: fraud.score },
          },
        });

        // Outbox for notification
        await tx.outboxEvent.create({
          data: {
            id: uuidv4(),
            aggregateId: paymentId,
            aggregateType: 'Payment',
            eventType: 'payment.success',
            payload: { paymentId, merchantId, correlationId },
            correlationId,
            status: OutboxStatus.PENDING,
          },
        });
      });

      paymentsCreated.inc({ status: 'success', currency: payment.currency, method: payment.paymentMethod });
      logger.info({ correlationId, paymentId }, 'Payment processed successfully');
    } catch (error) {
      await this.repo.updateStatus(paymentId, PaymentStatus.FAILED, {
        errorCode: 'PROCESSING_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      paymentsCreated.inc({ status: 'failed', currency: payment.currency, method: payment.paymentMethod });
      logger.error({ correlationId, paymentId, error }, 'Payment processing failed');
    }
  }

  async getById(id: string) {
    const payment = await this.repo.findById(id);
    if (!payment) throw new NotFoundError('Payment', id);
    return payment;
  }

  async getAll(
    params: PaginationParams & {
      merchantId?: string;
      customerId?: string;
      status?: PaymentStatus;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { data, total } = await this.repo.findAll({
      ...params,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
    });
    return buildPaginatedResult(data, total, params);
  }

  async cancel(id: string, merchantId: string, reason?: string) {
    const payment = await this.getById(id);
    if (payment.merchantId !== merchantId) throw new ForbiddenError('Not authorized to cancel this payment');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ForbiddenError(`Cannot cancel payment in ${payment.status} status`);
    }
    return this.repo.updateStatus(id, PaymentStatus.CANCELLED, { errorMessage: reason });
  }

  async getStats(merchantId?: string) {
    return this.repo.getStats(merchantId);
  }
}
