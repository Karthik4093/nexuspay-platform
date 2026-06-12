import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError | AppError | ZodError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const correlationId = request.correlationId;

      if (error instanceof ZodError) {
        logger.warn({ correlationId, errors: error.errors }, 'Validation error');
        return reply.status(422).send({
          success: false,
          correlationId,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (error instanceof AppError) {
        if (error.statusCode >= 500) {
          logger.error({ correlationId, error }, 'Application error');
        } else {
          logger.warn({ correlationId, code: error.code, message: error.message }, 'Client error');
        }
        return reply.status(error.statusCode).send({
          success: false,
          correlationId,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Fastify validation errors
      if ('validation' in error && error.validation) {
        return reply.status(400).send({
          success: false,
          correlationId,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      logger.error({ correlationId, error: { message: error.message, stack: error.stack } }, 'Unhandled error');
      return reply.status(500).send({
        success: false,
        correlationId,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
      });
    },
  );

  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      success: false,
      correlationId: request.correlationId,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  });
}
