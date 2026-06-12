import { PrismaClient, Merchant, MerchantStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { generateApiKey, generateApiSecret, generateWebhookSecret } from '../utils/crypto';
import { getSkipTake } from '../utils/pagination';

export class MerchantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Merchant | null> {
    return this.prisma.merchant.findFirst({ where: { id, deletedAt: null } });
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    return this.prisma.merchant.findFirst({ where: { email, deletedAt: null } });
  }

  async findByApiKey(apiKey: string): Promise<Merchant | null> {
    return this.prisma.merchant.findFirst({ where: { apiKey, deletedAt: null } });
  }

  async findAll(params: { page: number; limit: number; status?: MerchantStatus; search?: string }) {
    const where = {
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { email: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        ...getSkipTake(params),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.merchant.count({ where }),
    ]);

    return { data, total };
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    businessType?: string;
    country?: string;
    currency?: string;
    timezone?: string;
    webhookUrl?: string;
  }): Promise<Merchant> {
    return this.prisma.merchant.create({
      data: {
        id: uuidv4(),
        ...data,
        apiKey: generateApiKey(),
        apiSecret: generateApiSecret(),
        webhookSecret: data.webhookUrl ? generateWebhookSecret() : undefined,
        status: MerchantStatus.PENDING,
      },
    });
  }

  async update(id: string, data: Partial<Merchant>): Promise<Merchant> {
    return this.prisma.merchant.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: MerchantStatus): Promise<Merchant> {
    return this.prisma.merchant.update({ where: { id }, data: { status } });
  }

  async rotateApiKey(id: string): Promise<{ apiKey: string; apiSecret: string }> {
    const newKey = generateApiKey();
    const newSecret = generateApiSecret();
    await this.prisma.merchant.update({
      where: { id },
      data: { apiKey: newKey, apiSecret: newSecret },
    });
    return { apiKey: newKey, apiSecret: newSecret };
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.merchant.update({
      where: { id },
      data: { deletedAt: new Date(), status: MerchantStatus.CLOSED },
    });
  }
}
