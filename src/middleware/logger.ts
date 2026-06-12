import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export async function loggerPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.log.info(
      {
        correlationId: request.correlationId,
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      'incoming request',
    );
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Date.now() - request.startTime;
    logger.info(
      {
        correlationId: request.correlationId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration,
        userId: request.user?.sub,
      },
      'request completed',
    );
  });

  fastify.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    logger.error(
      {
        correlationId: request.correlationId,
        method: request.method,
        url: request.url,
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
      'request error',
    );
  });
}
