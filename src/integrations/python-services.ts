import { callService } from './circuit-breaker';
import { config } from '../config';
import { logger } from '../utils/logger';
import { fraudDetectionLatency } from '../middleware/metrics';

export interface FraudCheckRequest {
  paymentId: string;
  amount: number;
  currency: string;
  customerId?: string;
  merchantId: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface FraudCheckResponse {
  score: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  flags: string[];
}

export interface TaxCalculationRequest {
  amount: number;
  currency: string;
  country: string;
  merchantId: string;
  productType?: string;
}

export interface TaxCalculationResponse {
  taxAmount: number;
  taxRate: number;
  netAmount: number;
  breakdown: Array<{ type: string; rate: number; amount: number }>;
}

export interface CurrencyConversionRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export interface CurrencyConversionResponse {
  convertedAmount: number;
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  timestamp: string;
}

export interface NotificationRequest {
  type: 'EMAIL' | 'SMS' | 'WEBHOOK';
  recipient: string;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export async function checkFraud(
  data: FraudCheckRequest,
  correlationId?: string,
): Promise<FraudCheckResponse> {
  const end = fraudDetectionLatency.startTimer();
  try {
    const result = await callService<FraudCheckResponse>('fraud-detection', {
      method: 'POST',
      url: `${config.FRAUD_SERVICE_URL}/api/v1/fraud/check`,
      data,
      headers: { 'x-correlation-id': correlationId },
      timeout: 5000,
    });
    return result;
  } catch {
    logger.warn({ correlationId }, 'Fraud service unavailable, using fallback');
    return { score: 50, risk: 'MEDIUM', recommendation: 'REVIEW', flags: ['SERVICE_UNAVAILABLE'] };
  } finally {
    end();
  }
}

export async function calculateTax(
  data: TaxCalculationRequest,
  correlationId?: string,
): Promise<TaxCalculationResponse> {
  try {
    return await callService<TaxCalculationResponse>('tax-calculation', {
      method: 'POST',
      url: `${config.TAX_SERVICE_URL}/api/v1/tax/calculate`,
      data,
      headers: { 'x-correlation-id': correlationId },
      timeout: 3000,
    });
  } catch {
    logger.warn({ correlationId }, 'Tax service unavailable, using fallback');
    const taxRate = 0.1;
    return {
      taxAmount: data.amount * taxRate,
      taxRate,
      netAmount: data.amount * (1 - taxRate),
      breakdown: [{ type: 'VAT', rate: taxRate, amount: data.amount * taxRate }],
    };
  }
}

export async function convertCurrency(
  data: CurrencyConversionRequest,
  correlationId?: string,
): Promise<CurrencyConversionResponse> {
  try {
    return await callService<CurrencyConversionResponse>('currency-conversion', {
      method: 'POST',
      url: `${config.CURRENCY_SERVICE_URL}/api/v1/currency/convert`,
      data,
      headers: { 'x-correlation-id': correlationId },
      timeout: 3000,
    });
  } catch {
    logger.warn({ correlationId }, 'Currency service unavailable, using fallback');
    return {
      convertedAmount: data.amount,
      rate: 1.0,
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function sendNotification(
  data: NotificationRequest,
  correlationId?: string,
): Promise<void> {
  try {
    await callService<void>('notification', {
      method: 'POST',
      url: `${config.NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`,
      data,
      headers: { 'x-correlation-id': correlationId },
      timeout: 5000,
    });
  } catch {
    logger.warn({ correlationId }, 'Notification service unavailable');
  }
}

export async function getAiScore(
  data: Record<string, unknown>,
  correlationId?: string,
): Promise<{ score: number; confidence: number; category: string }> {
  try {
    return await callService('ai-scoring', {
      method: 'POST',
      url: `${config.AI_SCORING_SERVICE_URL}/api/v1/score`,
      data,
      headers: { 'x-correlation-id': correlationId },
      timeout: 5000,
    });
  } catch {
    return { score: 0.5, confidence: 0.0, category: 'UNKNOWN' };
  }
}
