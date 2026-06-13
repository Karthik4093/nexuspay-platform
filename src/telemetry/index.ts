import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { AmqplibInstrumentation } from '@opentelemetry/instrumentation-amqplib';
import { config } from '../config';

let sdk: NodeSDK | null = null;

export function initTelemetry() {
  if (!config.OTEL_ENABLED) return;

  const prometheusExporter = new PrometheusExporter({
    port: config.METRICS_PORT,
    endpoint: '/metrics',
  });

  sdk = new NodeSDK({
    resource: new Resource({
      'service.name': config.SERVICE_NAME,
      'service.version': '1.0.0',
      'deployment.environment': config.NODE_ENV,
    }),
    metricReader: prometheusExporter,
    instrumentations: [
      new FastifyInstrumentation(),
      new PgInstrumentation(),
      new IORedisInstrumentation(),
      new AmqplibInstrumentation(),
    ],
  });

  sdk.start();
  console.log('OpenTelemetry initialized');
}

export async function shutdownTelemetry() {
  if (sdk) {
    await sdk.shutdown();
  }
}
