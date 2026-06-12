import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashSHA256 } from '../../utils/crypto';
import { buildPaginatedResult } from '../../utils/pagination';
import { IdempotencyError, NotFoundError, ForbiddenError } from '../../utils/errors';

describe('Payment Service - Unit Tests', () => {
  describe('hashSHA256', () => {
    it('should produce consistent hash', () => {
      const data = 'test-data';
      const hash1 = hashSHA256(data);
      const hash2 = hashSHA256(data);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should produce different hashes for different inputs', () => {
      expect(hashSHA256('data1')).not.toBe(hashSHA256('data2'));
    });
  });

  describe('buildPaginatedResult', () => {
    it('should compute total pages correctly', () => {
      const result = buildPaginatedResult([1, 2, 3], 25, { page: 1, limit: 10 });
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(25);
      expect(result.data).toHaveLength(3);
    });

    it('should handle single page', () => {
      const result = buildPaginatedResult([1, 2], 2, { page: 1, limit: 20 });
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('IdempotencyError', () => {
    it('should have 409 status and correct code', () => {
      const err = new IdempotencyError();
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('DUPLICATE_REQUEST');
    });
  });

  describe('ForbiddenError', () => {
    it('should have 403 status', () => {
      const err = new ForbiddenError('Not your resource');
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Not your resource');
    });
  });
});
