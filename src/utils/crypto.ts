import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashSHA256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateApiKey(): string {
  return `mk_live_${crypto.randomBytes(16).toString('hex')}`;
}

export function generateApiSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function createHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
