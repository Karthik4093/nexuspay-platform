import { PrismaClient, User, UserRole, UserStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    merchantId?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role ?? UserRole.MERCHANT,
        merchantId: data.merchantId,
        emailVerified: false,
      },
    });
  }

  async update(id: string, data: Partial<Pick<User, 'passwordHash' | 'lastLoginAt' | 'failedLoginCount' | 'lockedUntil' | 'status' | 'emailVerified'>>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.DELETED },
    });
  }

  async incrementFailedLogin(id: string, currentCount: number): Promise<void> {
    const MAX_FAILED_ATTEMPTS = 5;
    const willLock = currentCount + 1 >= MAX_FAILED_ATTEMPTS;
    await this.prisma.user.update({
      where: { id },
      data: {
        failedLoginCount: { increment: 1 },
        ...(willLock ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
      },
    });
  }

  async resetFailedLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }
}
