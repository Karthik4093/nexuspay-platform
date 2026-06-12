import { nanoid } from 'nanoid';

export function generateCorrelationId(): string {
  return `req_${nanoid(20)}`;
}

export function generateIdempotencyKey(): string {
  return `idem_${nanoid(32)}`;
}

export function generateApiKey(): string {
  return `mk_live_${nanoid(32)}`;
}

export function generateApiSecret(): string {
  return `sk_live_${nanoid(48)}`;
}
