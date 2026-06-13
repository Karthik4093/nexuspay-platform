import { describe, it, expect } from 'vitest';
import { generateCorrelationId } from '../../utils/correlation';
import { successResponse, errorResponse } from '../../utils/response';
import { getPaginationParams, getSkipTake, buildPaginatedResult } from '../../utils/pagination';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  TooManyRequestsError,
  ServiceUnavailableError,
  IdempotencyError,
} from '../../utils/errors';
import { hashSHA256, generateSecureToken, generateApiKey } from '../../utils/crypto';

describe('correlation', () => {
  it('generates unique ids', () => {
    const a = generateCorrelationId();
    const b = generateCorrelationId();
    expect(a).not.toBe(b);
  });

  it('starts with req_', () => {
    expect(generateCorrelationId()).toMatch(/^req_/);
  });
});

describe('response utils', () => {
  it('successResponse includes success flag', () => {
    const r = successResponse({ foo: 'bar' }, 'req-1');
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ foo: 'bar' });
    expect(r.correlationId).toBe('req-1');
  });

  it('errorResponse includes error flag', () => {
    const r = errorResponse('Something went wrong', 500, 'req-2');
    expect(r.success).toBe(false);
    expect(r.error.message).toBe('Something went wrong');
    expect(r.error.statusCode).toBe(500);
  });
});

describe('pagination', () => {
  it('getPaginationParams defaults', () => {
    const p = getPaginationParams({});
    expect(p.page).toBe(1);
    expect(p.limit).toBe(20);
  });

  it('getPaginationParams clamps limit', () => {
    const p = getPaginationParams({ limit: '500' });
    expect(p.limit).toBe(100);
  });

  it('getPaginationParams min page is 1', () => {
    const p = getPaginationParams({ page: '-5' });
    expect(p.page).toBe(1);
  });

  it('getSkipTake calculates correctly', () => {
    const { skip, take } = getSkipTake({ page: 3, limit: 10 });
    expect(skip).toBe(20);
    expect(take).toBe(10);
  });

  it('buildPaginatedResult metadata', () => {
    const result = buildPaginatedResult([1, 2, 3], 25, { page: 2, limit: 10 });
    expect(result.data).toHaveLength(3);
    expect(result.meta.total).toBe(25);
    expect(result.meta.page).toBe(2);
    expect(result.meta.totalPages).toBe(3);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPrevPage).toBe(true);
  });

  it('buildPaginatedResult last page', () => {
    const result = buildPaginatedResult([1], 21, { page: 3, limit: 10 });
    expect(result.meta.hasNextPage).toBe(false);
  });
});

describe('error classes', () => {
  it('NotFoundError has 404 status', () => {
    const e = new NotFoundError('Resource');
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('Resource');
    expect(e).toBeInstanceOf(AppError);
  });

  it('UnauthorizedError has 401 status', () => {
    const e = new UnauthorizedError();
    expect(e.statusCode).toBe(401);
  });

  it('ForbiddenError has 403 status', () => {
    const e = new ForbiddenError();
    expect(e.statusCode).toBe(403);
  });

  it('ValidationError has 422 status', () => {
    const e = new ValidationError('Bad input');
    expect(e.statusCode).toBe(422);
  });

  it('ConflictError has 409 status', () => {
    const e = new ConflictError('Duplicate');
    expect(e.statusCode).toBe(409);
  });

  it('TooManyRequestsError has 429 status', () => {
    const e = new TooManyRequestsError();
    expect(e.statusCode).toBe(429);
  });

  it('ServiceUnavailableError has 503 status', () => {
    const e = new ServiceUnavailableError('fraud-detection');
    expect(e.statusCode).toBe(503);
  });

  it('IdempotencyError has 409 status', () => {
    const e = new IdempotencyError();
    expect(e.statusCode).toBe(409);
  });

  it('errors are instanceof Error', () => {
    expect(new NotFoundError('X')).toBeInstanceOf(Error);
  });
});

describe('crypto utils', () => {
  it('hashSHA256 is deterministic', () => {
    expect(hashSHA256('hello')).toBe(hashSHA256('hello'));
  });

  it('hashSHA256 differs for different input', () => {
    expect(hashSHA256('hello')).not.toBe(hashSHA256('world'));
  });

  it('hashSHA256 returns hex string', () => {
    expect(hashSHA256('test')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generateSecureToken has correct length', () => {
    const t = generateSecureToken(32);
    expect(t.length).toBeGreaterThanOrEqual(32);
  });

  it('generateSecureToken returns different values', () => {
    expect(generateSecureToken(16)).not.toBe(generateSecureToken(16));
  });

  it('generateApiKey starts with mk_live_', () => {
    expect(generateApiKey()).toMatch(/^mk_live_/);
  });
});
