import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { redisClient } from '../queues/redis';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  merchantId?: string;
  sessionId?: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as JwtPayload;

    // Check if token is blacklisted
    const redis = redisClient();
    const blacklisted = await redis.get(`blacklist:${request.headers.authorization?.split(' ')[1]}`);
    if (blacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requireRoles(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user;
    if (!user) throw new UnauthorizedError();
    if (!roles.includes(user.role)) {
      throw new ForbiddenError(`Required role: ${roles.join(' or ')}`);
    }
  };
}

export const requireAdmin = requireRoles(UserRole.ADMIN);
export const requireMerchant = requireRoles(UserRole.ADMIN, UserRole.MERCHANT);
export const requireSupport = requireRoles(UserRole.ADMIN, UserRole.SUPPORT);
