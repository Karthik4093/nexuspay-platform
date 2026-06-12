import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// We test pure logic parts - password hashing, token utilities
import { hashPassword, verifyPassword } from '../../utils/crypto';
import { generateCorrelationId } from '../../utils/correlation';
import { AppError, NotFoundError, ConflictError, UnauthorizedError } from '../../utils/errors';

describe('Crypto utilities', () => {
  it('should hash and verify password correctly', async () => {
    const password = 'TestPassword@123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2b$')).toBe(true);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should fail verification with wrong password', async () => {
    const hash = await hashPassword('CorrectPassword@1');
    const isValid = await verifyPassword('WrongPassword@1', hash);
    expect(isValid).toBe(false);
  });
});

describe('Correlation ID', () => {
  it('should generate unique correlation IDs', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    expect(id1).toMatch(/^req_/);
    expect(id2).toMatch(/^req_/);
    expect(id1).not.toBe(id2);
  });
});

describe('Error Classes', () => {
  it('NotFoundError should have 404 status', () => {
    const err = new NotFoundError('User', '123');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toContain('User');
  });

  it('ConflictError should have 409 status', () => {
    const err = new ConflictError('Duplicate entry');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('UnauthorizedError should have 401 status', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });
});

describe('Pagination utilities', () => {
  it('should compute skip/take correctly', async () => {
    const { getSkipTake, getPaginationParams } = await import('../../utils/pagination');
    const params = getPaginationParams({ page: '3', limit: '20' });
    expect(params.page).toBe(3);
    expect(params.limit).toBe(20);
    const { skip, take } = getSkipTake(params);
    expect(skip).toBe(40);
    expect(take).toBe(20);
  });

  it('should cap limit at 100', async () => {
    const { getPaginationParams } = await import('../../utils/pagination');
    const params = getPaginationParams({ limit: '500' });
    expect(params.limit).toBe(100);
  });
});
