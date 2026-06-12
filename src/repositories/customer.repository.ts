import { PrismaClient, Customer, CustomerStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getSkipTake } from '../utils/pagination';

export class CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
  }

  async findByMerchantAndEmail(merchantId: string, email: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: { merchantId, email, deletedAt: null },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    merchantId?: string;
    status?: CustomerStatus;
    search?: string;
  }) {
    const where = {
      deletedAt: null,
      ...(params.merchantId ? { merchantId: params.merchantId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' as const } },
              { firstName: { contains: params.search, mode: 'insensitive' as const } },
              { lastName: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        ...getSkipTake(params),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total };
  }

  async create(data: {
    merchantId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Customer> {
    return this.prisma.customer.create({
      data: { id: uuidv4(), ...data },
    });
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: CustomerStatus.INACTIVE },
    });
  }
}
