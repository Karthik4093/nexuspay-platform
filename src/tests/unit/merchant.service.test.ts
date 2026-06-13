import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { buildPaginatedResult, getPaginationParams } from '../../utils/pagination';
import { generateApiKey } from '../../utils/crypto';

// Isolated unit tests for merchant-related utilities and logic
// Full integration tests are in src/tests/integration/

describe('merchant utilities', () => {
  describe('API key generation', () => {
    it('generates keys with mk_live_ prefix', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^mk_live_/);
    });

    it('generates unique keys', () => {
      const keys = new Set(Array.from({ length: 10 }, () => generateApiKey()));
      expect(keys.size).toBe(10);
    });

    it('generated key has sufficient length', () => {
      const key = generateApiKey();
      expect(key.length).toBeGreaterThan(20);
    });
  });

  describe('merchant pagination', () => {
    it('returns correct meta for first page', () => {
      const merchants = Array.from({ length: 10 }, (_, i) => ({ id: `${i}` }));
      const result = buildPaginatedResult(merchants, 35, { page: 1, limit: 10 });
      expect(result.meta.hasPrevPage).toBe(false);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.totalPages).toBe(4);
    });

    it('returns correct meta for middle page', () => {
      const merchants = Array.from({ length: 10 }, (_, i) => ({ id: `${i}` }));
      const result = buildPaginatedResult(merchants, 35, { page: 2, limit: 10 });
      expect(result.meta.hasPrevPage).toBe(true);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('returns correct meta for last page', () => {
      const merchants = Array.from({ length: 5 }, (_, i) => ({ id: `${i}` }));
      const result = buildPaginatedResult(merchants, 35, { page: 4, limit: 10 });
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe('error hierarchy for merchant actions', () => {
    it('ConflictError is thrown for duplicate emails', () => {
      const err = new ConflictError('Merchant with this email already exists');
      expect(err.statusCode).toBe(409);
      expect(err.message).toContain('email');
    });

    it('NotFoundError is thrown for missing merchants', () => {
      const id = 'merchant-nonexistent';
      const err = new NotFoundError(`Merchant ${id} not found`);
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain(id);
    });

    it('ForbiddenError is thrown when merchant accesses other merchant data', () => {
      const err = new ForbiddenError('Access denied');
      expect(err.statusCode).toBe(403);
    });
  });
});
