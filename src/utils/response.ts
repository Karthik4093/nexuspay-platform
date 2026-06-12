import { FastifyReply } from 'fastify';

export interface ApiResponse<T = unknown> {
  success: boolean;
  correlationId?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export function successResponse<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: ApiResponse['meta'],
): void {
  const correlationId = (reply.request as { correlationId?: string }).correlationId;
  void reply.status(statusCode).send({
    success: true,
    correlationId,
    data,
    meta,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<T>);
}

export function errorResponse(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const correlationId = (reply.request as { correlationId?: string }).correlationId;
  void reply.status(statusCode).send({
    success: false,
    correlationId,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse);
}
