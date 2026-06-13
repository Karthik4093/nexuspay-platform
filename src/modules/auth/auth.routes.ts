import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth.service';
import { authenticate } from '../../middleware/auth';

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma as PrismaClient;
  const authService = new AuthService(fastify, prisma);
  const controller = new AuthController(authService);

  fastify.post('/auth/register', {
    schema: { tags: ['Auth'], summary: 'Register a new user' },
    handler: controller.register.bind(controller),
  });

  fastify.post('/auth/login', {
    schema: { tags: ['Auth'], summary: 'Login with email and password' },
    handler: controller.login.bind(controller),
  });

  fastify.post('/auth/refresh', {
    schema: { tags: ['Auth'], summary: 'Refresh access token' },
    handler: controller.refresh.bind(controller),
  });

  fastify.post('/auth/logout', {
    preHandler: [authenticate],
    schema: { tags: ['Auth'], summary: 'Logout current session', security: [{ bearerAuth: [] }] },
    handler: controller.logout.bind(controller),
  });

  fastify.post('/auth/change-password', {
    preHandler: [authenticate],
    schema: { tags: ['Auth'], summary: 'Change password', security: [{ bearerAuth: [] }] },
    handler: controller.changePassword.bind(controller),
  });

  fastify.post('/auth/forgot-password', {
    schema: { tags: ['Auth'], summary: 'Request password reset' },
    handler: controller.forgotPassword.bind(controller),
  });

  fastify.post('/auth/reset-password', {
    schema: { tags: ['Auth'], summary: 'Reset password with token' },
    handler: controller.resetPassword.bind(controller),
  });

  fastify.get('/auth/me', {
    preHandler: [authenticate],
    schema: { tags: ['Auth'], summary: 'Get current user', security: [{ bearerAuth: [] }] },
    handler: controller.me.bind(controller),
  });
}
