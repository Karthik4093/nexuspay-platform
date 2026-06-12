import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'nexuspay_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'nexuspay_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const activeConnections = new Gauge({
  name: 'nexuspay_active_connections',
  help: 'Number of active connections',
});

export const paymentsCreated = new Counter({
  name: 'nexuspay_payments_created_total',
  help: 'Total payments created',
  labelNames: ['status', 'currency', 'method'],
});

export const queueJobsTotal = new Counter({
  name: 'nexuspay_queue_jobs_total',
  help: 'Total queue jobs processed',
  labelNames: ['queue', 'status'],
});

export const fraudDetectionLatency = new Histogram({
  name: 'nexuspay_fraud_detection_duration_seconds',
  help: 'Fraud detection service call duration',
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const circuitBreakerState = new Gauge({
  name: 'nexuspay_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['service'],
});

export async function metricsPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async () => {
    activeConnections.inc();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    activeConnections.dec();
    const route = request.routerPath || request.url;
    const labels = {
      method: request.method,
      route,
      status_code: reply.statusCode.toString(),
    };
    httpRequestsTotal.inc(labels);
    const duration = (Date.now() - request.startTime) / 1000;
    httpRequestDuration.observe(labels, duration);
  });

  fastify.get('/metrics', async (_req, reply) => {
    void reply.header('Content-Type', register.contentType);
    return reply.send(await register.metrics());
  });
}
