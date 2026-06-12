import { PrismaClient, Payment, PaymentStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getSkipTake } from '../utils/pagination';

export class PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { merchant: true, customer: true, refunds: true },
    });
  }

  async findByIdempotencyKey(keyId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({ where: { idempotencyKeyId: keyId } });
  }

  async findAll(params: {
    page: number;
    limit: number;
    merchantId?: string;
    customerId?: string;
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.PaymentWhereInput = {
      ...(params.merchantId ? { merchantId: params.merchantId } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.startDate || params.endDate
        ? { createdAt: { gte: params.startDate, lte: params.endDate } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        ...getSkipTake(params),
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total };
  }

  async create(
    data: {
      merchantId: string;
      customerId?: string;
      idempotencyKeyId?: string;
      correlationId: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Payment> {
    const client = tx ?? this.prisma;
    return client.payment.create({
      data: {
        id: uuidv4(),
        ...data,
        status: PaymentStatus.PENDING,
      } as Prisma.PaymentCreateInput,
    });
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    extra?: Partial<Payment>,
    tx?: Prisma.TransactionClient,
  ): Promise<Payment> {
    const client = tx ?? this.prisma;
    return client.payment.update({
      where: { id },
      data: {
        status,
        ...(extra ?? {}),
        ...(status === PaymentStatus.SUCCESS || status === PaymentStatus.FAILED
          ? { processedAt: new Date() }
          : {}),
      },
    });
  }

  async getStats(merchantId?: string) {
    const where = merchantId ? { merchantId } : {};
    const [total, byStatus] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { amount: true },
      }),
    ]);
    return { total, byStatus };
  }
}
