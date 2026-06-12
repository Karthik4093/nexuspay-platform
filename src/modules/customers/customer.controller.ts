import { FastifyRequest, FastifyReply } from 'fastify';
import { CustomerService } from '../../services/customer.service';
import { successResponse } from '../../utils/response';
import { CreateCustomerInput, UpdateCustomerInput, CustomerQueryInput } from '../../validators/customer.validators';
import { getPaginationParams } from '../../utils/pagination';
import { CustomerStatus } from '@prisma/client';

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  async create(
    request: FastifyRequest<{ Body: CreateCustomerInput; Params: { merchantId: string } }>,
    reply: FastifyReply,
  ) {
    const customer = await this.customerService.create(request.params.merchantId, request.body);
    successResponse(reply, customer, 201);
  }

  async getAll(request: FastifyRequest<{ Querystring: CustomerQueryInput }>, reply: FastifyReply) {
    const pagination = getPaginationParams(request.query);
    const merchantId = request.user?.role === 'MERCHANT' ? request.user.merchantId : request.query.merchantId;
    const result = await this.customerService.getAll({
      ...pagination,
      merchantId,
      status: request.query.status as CustomerStatus | undefined,
      search: request.query.search,
    });
    successResponse(reply, result.data, 200, result.meta);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const customer = await this.customerService.getById(request.params.id);
    successResponse(reply, customer);
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateCustomerInput }>,
    reply: FastifyReply,
  ) {
    const customer = await this.customerService.update(request.params.id, request.body);
    successResponse(reply, customer);
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.customerService.delete(request.params.id);
    successResponse(reply, { message: 'Customer deleted' });
  }
}
