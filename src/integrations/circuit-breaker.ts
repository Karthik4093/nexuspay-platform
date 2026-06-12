import CircuitBreaker from 'opossum';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { circuitBreakerState } from '../middleware/metrics';
import { ServiceUnavailableError } from '../utils/errors';

const breakers = new Map<string, CircuitBreaker>();

function createBreaker(serviceName: string): CircuitBreaker {
  const breaker = new CircuitBreaker(
    async (reqConfig: AxiosRequestConfig): Promise<AxiosResponse> => {
      return axios(reqConfig);
    },
    {
      timeout: config.CIRCUIT_BREAKER_TIMEOUT,
      errorThresholdPercentage: config.CIRCUIT_BREAKER_ERROR_THRESHOLD,
      resetTimeout: config.CIRCUIT_BREAKER_RESET_TIMEOUT,
      volumeThreshold: 5,
      rollingCountTimeout: 10000,
    },
  );

  breaker.on('open', () => {
    circuitBreakerState.set({ service: serviceName }, 1);
    logger.warn({ service: serviceName }, 'Circuit breaker opened');
  });

  breaker.on('close', () => {
    circuitBreakerState.set({ service: serviceName }, 0);
    logger.info({ service: serviceName }, 'Circuit breaker closed');
  });

  breaker.on('halfOpen', () => {
    circuitBreakerState.set({ service: serviceName }, 2);
    logger.info({ service: serviceName }, 'Circuit breaker half-open');
  });

  breaker.fallback(() => {
    throw new ServiceUnavailableError(serviceName);
  });

  return breaker;
}

export function getBreaker(serviceName: string): CircuitBreaker {
  if (!breakers.has(serviceName)) {
    breakers.set(serviceName, createBreaker(serviceName));
  }
  return breakers.get(serviceName)!;
}

export async function callService<T>(
  serviceName: string,
  reqConfig: AxiosRequestConfig,
): Promise<T> {
  const breaker = getBreaker(serviceName);
  try {
    const response = await breaker.fire(reqConfig) as AxiosResponse<T>;
    return response.data;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) throw error;
    logger.error({ service: serviceName, error }, 'Service call failed');
    throw new ServiceUnavailableError(serviceName);
  }
}
