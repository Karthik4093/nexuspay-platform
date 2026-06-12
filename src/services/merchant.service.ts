import { PrismaClient, MerchantStatus } from '@prisma/client';
import { MerchantRepository } from '../repositories/merchant.repository';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { buildPaginatedResult, PaginationParams } from '../utils/pagination';
import { CreateMerchantInput, UpdateMerchantInput } from '../validators/merchant.validators';

export class MerchantService {
  private repo: MerchantRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new MerchantRepository(prisma);
  }

  async create(input: CreateMerchantInput) {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw new ConflictError('Merchant with this email already exists');
    return this.repo.create(input);
  }

  async getById(id: string) {
    const merchant = await this.repo.findById(id);
    if (!merchant) throw new NotFoundError('Merchant', id);
    return merchant;
  }

  async getAll(params: PaginationParams & { status?: MerchantStatus; search?: string }) {
    const { data, total } = await this.repo.findAll(params);
    return buildPaginatedResult(data, total, params);
  }

  async update(id: string, input: UpdateMerchantInput) {
    await this.getById(id);
    return this.repo.update(id, input);
  }

  async activate(id: string) {
    const merchant = await this.getById(id);
    if (merchant.status === MerchantStatus.CLOSED) {
      throw new ForbiddenError('Cannot activate a closed merchant');
    }
    return this.repo.updateStatus(id, MerchantStatus.ACTIVE);
  }

  async suspend(id: string) {
    await this.getById(id);
    return this.repo.updateStatus(id, MerchantStatus.SUSPENDED);
  }

  async rotateKeys(id: string) {
    await this.getById(id);
    return this.repo.rotateApiKey(id);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repo.softDelete(id);
  }
}
