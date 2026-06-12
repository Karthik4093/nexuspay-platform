import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth.service';
import { authenticate } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validators/auth.validators';
import { ZodTypeProvider } from '../../utils/zod-provider';

export async function authRoutes(fastify: FastifyInstance, options: { prefix: string }) {
  const prisma = fastify.prisma as PrismaClient;
  const authService = new AuthService(fastify, prisma);
  const controller = new AuthController(authService);

  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.post(`${options.prefix}/auth/register`, {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      body: registerSchema,
    },
    handler: controller.register.bind(controller),
  });

  f.post(`${options.prefix}/auth/login`, {
    schema: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      body: loginSchema,
    },
    handler: controller.login.bind(controller),
  });

  f.post(`${options.prefix}/auth/refresh`, {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      body: refreshTokenSchema,
    },
    handler: controller.refresh.bind(controller),
  });

  f.post(`${options.prefix}/auth/logout`, {
    preHandler: [authenticate],
    schema: { tags: ['Auth'], summary: 'Logout current session', security: [{ bearerAuth: [] }] },
    handler: controller.logout.bind(controller),
  });

  f.post(`${options.prefix}/auth/change-password`, {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Change password',
      body: changePasswordSchema,
      security: [{ bearerAuth: [] }],
    },
    handler: controller.changePassword.bind(controller),
  });

  f.post(`${options.prefix}/auth/forgot-password`, {
    schema: { tags: ['Auth'], summary: 'Request password reset', body: forgotPasswordSchema },
    handler: controller.forgotPassword.bind(controller),
  });

  f.post(`${options.prefix}/auth/reset-password`, {
    schema: { tags: ['Auth'], summary: 'Reset password with token', body: resetPasswordSchema },
    handler: controller.resetPassword.bind(controller),
  });

  f.get(`${options.prefix}/auth/me`, {
    preHandler: [authenticate],
    schema: { tags: ['Auth'], summary: 'Get current user', security: [{ bearerAuth: [] }] },
    handler: controller.me.bind(controller),
  });
}
