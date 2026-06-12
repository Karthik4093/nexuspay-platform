import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../../services/auth.service';
import { successResponse } from '../../utils/response';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../../validators/auth.validators';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply,
  ) {
    const result = await this.authService.register(request.body);
    successResponse(reply, result, 201);
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply,
  ) {
    const result = await this.authService.login(
      request.body,
      request.ip,
      request.headers['user-agent'],
    );
    successResponse(reply, result);
  }

  async refresh(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply,
  ) {
    const tokens = await this.authService.refreshTokens(request.body.refreshToken);
    successResponse(reply, tokens);
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const token = request.headers.authorization?.split(' ')[1] ?? '';
    await this.authService.logout(request.user!.sub, token);
    successResponse(reply, { message: 'Logged out successfully' });
  }

  async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordInput }>,
    reply: FastifyReply,
  ) {
    await this.authService.changePassword(request.user!.sub, request.body);
    successResponse(reply, { message: 'Password changed successfully' });
  }

  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordInput }>,
    reply: FastifyReply,
  ) {
    await this.authService.forgotPassword(request.body);
    successResponse(reply, { message: 'If the email exists, a reset link has been sent' });
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordInput }>,
    reply: FastifyReply,
  ) {
    await this.authService.resetPassword(request.body);
    successResponse(reply, { message: 'Password reset successfully' });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    successResponse(reply, { user: request.user });
  }
}
