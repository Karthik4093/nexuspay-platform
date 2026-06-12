import { FastifyRequest, FastifyReply } from 'fastify';
import { MerchantService } from '../../services/merchant.service';
import { successResponse } from '../../utils/response';
import { CreateMerchantInput, UpdateMerchantInput, MerchantQueryInput } from '../../validators/merchant.validators';
import { getPaginationParams } from '../../utils/pagination';
import { MerchantStatus } from '@prisma/client';

export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  async create(request: FastifyRequest<{ Body: CreateMerchantInput }>, reply: FastifyReply) {
    const merchant = await this.merchantService.create(request.body);
    successResponse(reply, merchant, 201);
  }

  async getAll(request: FastifyRequest<{ Querystring: MerchantQueryInput }>, reply: FastifyReply) {
    const pagination = getPaginationParams(request.query);
    const result = await this.merchantService.getAll({
      ...pagination,
      status: request.query.status as MerchantStatus | undefined,
      search: request.query.search,
    });
    successResponse(reply, result.data, 200, result.meta);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const merchant = await this.merchantService.getById(request.params.id);
    successResponse(reply, merchant);
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateMerchantInput }>,
    reply: FastifyReply,
  ) {
    const merchant = await this.merchantService.update(request.params.id, request.body);
    successResponse(reply, merchant);
  }

  async activate(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const merchant = await this.merchantService.activate(request.params.id);
    successResponse(reply, merchant);
  }

  async suspend(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const merchant = await this.merchantService.suspend(request.params.id);
    successResponse(reply, merchant);
  }

  async rotateKeys(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const keys = await this.merchantService.rotateKeys(request.params.id);
    successResponse(reply, keys);
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.merchantService.delete(request.params.id);
    successResponse(reply, { message: 'Merchant deleted' });
  }
}
