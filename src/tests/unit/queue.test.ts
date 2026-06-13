import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// These tests validate queue infrastructure logic without real connections
// Real queue integration is tested in integration tests

describe('queue name constants', () => {
  it('QUEUE_NAMES has expected keys', async () => {
    const { QUEUE_NAMES } = await import('../../queues/bullmq');
    expect(QUEUE_NAMES).toHaveProperty('PAYMENT_PROCESSING');
    expect(QUEUE_NAMES).toHaveProperty('NOTIFICATION');
    expect(QUEUE_NAMES).toHaveProperty('REPORT_GENERATION');
    expect(QUEUE_NAMES).toHaveProperty('OUTBOX_PUBLISHER');
    expect(QUEUE_NAMES).toHaveProperty('AUDIT_LOG');
  });

  it('all queue names are non-empty strings', async () => {
    const { QUEUE_NAMES } = await import('../../queues/bullmq');
    Object.values(QUEUE_NAMES).forEach((name) => {
      expect(typeof name).toBe('string');
      expect((name as string).length).toBeGreaterThan(0);
    });
  });
});

describe('rabbitmq exchange names', () => {
  it('EXCHANGES constant has expected keys', async () => {
    const { EXCHANGES } = await import('../../queues/rabbitmq');
    expect(EXCHANGES).toHaveProperty('PAYMENT_EVENTS');
    expect(EXCHANGES).toHaveProperty('NOTIFICATION_EVENTS');
    expect(EXCHANGES).toHaveProperty('AUDIT_EVENTS');
    expect(EXCHANGES).toHaveProperty('DEAD_LETTER');
  });
});
