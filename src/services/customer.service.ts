import { PrismaClient, CustomerStatus } from '@prisma/client';
import { CustomerRepository } from '../repositories/customer.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { buildPaginatedResult, PaginationParams } from '../utils/pagination';
import { CreateCustomerInput, UpdateCustomerInput } from '../validators/customer.validators';

export class CustomerService {
  private repo: CustomerRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new CustomerRepository(prisma);
  }

  async create(merchantId: string, input: CreateCustomerInput) {
    const existing = await this.repo.findByMerchantAndEmail(merchantId, input.email);
    if (existing) throw new ConflictError('Customer with this email already exists for this merchant');
    return this.repo.create({ ...input, merchantId });
  }

  async getById(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundError('Customer', id);
    return customer;
  }

  async getAll(params: PaginationParams & { merchantId?: string; status?: CustomerStatus; search?: string }) {
    const { data, total } = await this.repo.findAll(params);
    return buildPaginatedResult(data, total, params);
  }

  async update(id: string, input: UpdateCustomerInput) {
    await this.getById(id);
    return this.repo.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repo.softDelete(id);
  }
}
