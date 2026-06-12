import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateCorrelationId } from '../utils/correlation';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
    startTime: number;
  }
}

export async function correlationPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('correlationId', '');
  fastify.decorateRequest('startTime', 0);

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.correlationId =
      (request.headers['x-correlation-id'] as string) || generateCorrelationId();
    request.startTime = Date.now();
  });

  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    void reply.header('x-correlation-id', request.correlationId);
    void reply.header('x-request-id', request.correlationId);
    const duration = Date.now() - request.startTime;
    void reply.header('x-response-time', `${duration}ms`);
  });
}
