import { FastifyInstance } from 'fastify';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import ms from 'ms';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword, generateSecureToken, hashSHA256 } from '../utils/crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../utils/errors';
import { redisClient } from '../queues/redis';
import {
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validators';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor(
    private readonly fastify: FastifyInstance,
    private readonly prisma: PrismaClient,
  ) {
    this.userRepo = new UserRepository(prisma);
  }

  async register(input: RegisterInput): Promise<{ user: Omit<User, 'passwordHash'>; tokens: TokenPair }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role as UserRole,
      merchantId: input.merchantId,
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    const tokens = await this.generateTokenPair(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: TokenPair }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenError('Account temporarily locked. Try again later');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      await this.userRepo.incrementFailedLogin(user.id);
      throw new UnauthorizedError('Invalid credentials');
    }

    await this.userRepo.resetFailedLogin(user.id);

    const tokens = await this.generateTokenPair(user);

    await this.prisma.session.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: hashSHA256(tokens.accessToken),
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + ms(config.JWT_EXPIRES_IN as ms.StringValue)),
      },
    });

    logger.info({ userId: user.id, ip: ipAddress }, 'User logged in');
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async refreshTokens(token: string): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored?.family) {
        await this.prisma.refreshToken.updateMany({
          where: { family: stored.family },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), rotatedAt: new Date() },
    });

    return this.generateTokenPair(stored.user, stored.family);
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    const ttl = Math.floor(ms(config.JWT_EXPIRES_IN as ms.StringValue) / 1000);
    await redisClient().setex(`blacklist:${accessToken}`, ttl, '1');
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.info({ userId }, 'User logged out');
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User');

    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError('Current password is incorrect');

    const newHash = await hashPassword(input.newPassword);
    await this.userRepo.update(userId, { passwordHash: newHash });
    logger.info({ userId }, 'Password changed');
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) return; // Don't reveal if email exists

    const token = generateSecureToken(32);
    await this.prisma.passwordResetToken.create({
      data: {
        id: uuidv4(),
        email: input.email.toLowerCase(),
        token: hashSHA256(token),
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    logger.info({ email: input.email }, 'Password reset token generated');
    // In production: send email with token
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashSHA256(input.token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { token: tokenHash, usedAt: null },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const user = await this.userRepo.findByEmail(record.email);
    if (!user) throw new NotFoundError('User');

    const passwordHash = await hashPassword(input.newPassword);
    await this.userRepo.update(user.id, { passwordHash });
    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    logger.info({ email: record.email }, 'Password reset successful');
  }

  private async generateTokenPair(user: User, existingFamily?: string): Promise<TokenPair> {
    const accessToken = this.fastify.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        merchantId: user.merchantId,
      },
      { expiresIn: config.JWT_EXPIRES_IN },
    );

    const refreshTokenValue = generateSecureToken(48);
    const family = existingFamily ?? uuidv4();

    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: refreshTokenValue,
        family,
        expiresAt: new Date(Date.now() + ms(config.JWT_REFRESH_EXPIRES_IN as ms.StringValue)),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: Math.floor(ms(config.JWT_EXPIRES_IN as ms.StringValue) / 1000),
    };
  }
}
