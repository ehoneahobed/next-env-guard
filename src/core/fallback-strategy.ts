/**
 * Fallback strategies for environment variable access.
 * Provides mechanisms to handle missing or invalid environment variables gracefully.
 * 
 * @internal
 */

import type { ZodTypeAny } from 'zod';
import { EnvNotInitializedError } from './errors';
import type { ClientEnv } from './types';

/**
 * Fallback strategy configuration.
 */
export interface FallbackStrategy {
  /**
   * Gets a fallback value for a missing environment variable.
   * 
   * @param key - Environment variable key
   * @param schema - Zod schema for the variable
   * @returns Fallback value or undefined
   */
  getFallback<T extends ZodTypeAny>(
    key: string,
    schema: T,
  ): ReturnType<T['_output']> | undefined;

  /**
   * Determines if a fallback should be used.
   * 
   * @param error - The error that occurred
   * @returns True if fallback should be used
   */
  shouldUseFallback(error: unknown): boolean;
}

/**
 * Default fallback strategy that uses schema defaults.
 */
export class DefaultFallbackStrategy implements FallbackStrategy {
  getFallback<T extends ZodTypeAny>(
    _key: string,
    schema: T,
  ): ReturnType<T['_output']> | undefined {
    // Try to get default value from schema
    try {
      type ZodDefWithDefault = {
        defaultValue?: () => { value: unknown };
      };
      const zodDef = (schema as unknown as { _def?: ZodDefWithDefault })._def;
      const defaultValue = zodDef?.defaultValue?.()?.value;
      
      if (defaultValue !== undefined) {
        return defaultValue as ReturnType<T['_output']>;
      }
    } catch {
      // Ignore errors when trying to get default
    }

    return undefined;
  }

  shouldUseFallback(error: unknown): boolean {
    return error instanceof EnvNotInitializedError;
  }
}

/**
 * Retry fallback strategy with exponential backoff.
 */
export class RetryFallbackStrategy implements FallbackStrategy {
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private retryCount = 0;

  constructor(maxRetries = 3, retryDelay = 100) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  getFallback<T extends ZodTypeAny>(
    _key: string,
    _schema: T,
  ): ReturnType<T['_output']> | undefined {
    // Retry strategy doesn't provide fallback values
    // It instead retries the operation
    return undefined;
  }

  shouldUseFallback(error: unknown): boolean {
    if (!(error instanceof EnvNotInitializedError)) {
      return false;
    }

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      return true;
    }

    return false;
  }

  /**
   * Waits for the retry delay with exponential backoff.
   * 
   * @returns Promise that resolves after delay
   */
  async waitForRetry(): Promise<void> {
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Resets the retry count.
   */
  reset(): void {
    this.retryCount = 0;
  }
}

/**
 * Custom fallback strategy with user-defined fallback values.
 */
export class CustomFallbackStrategy implements FallbackStrategy {
  private readonly fallbacks: Map<string, unknown>;

  constructor(fallbacks: Record<string, unknown>) {
    this.fallbacks = new Map(Object.entries(fallbacks));
  }

  getFallback<T extends ZodTypeAny>(
    key: string,
    _schema: T,
  ): ReturnType<T['_output']> | undefined {
    return this.fallbacks.get(key) as ReturnType<T['_output']> | undefined;
  }

  shouldUseFallback(error: unknown): boolean {
    return error instanceof EnvNotInitializedError;
  }
}

/**
 * Gets environment variables with fallback strategy.
 * 
 * @param getEnv - Function that returns environment variables
 * @param strategy - Fallback strategy to use
 * @returns Environment variables or undefined if all fallbacks fail
 */
export async function getEnvWithFallback<T extends Record<string, ZodTypeAny>>(
  getEnv: () => ClientEnv<T>,
  strategy: FallbackStrategy,
): Promise<ClientEnv<T> | undefined> {
  try {
    return getEnv();
  } catch (error) {
    if (!strategy.shouldUseFallback(error)) {
      throw error;
    }

    // If it's a retry strategy, wait and retry
    if (strategy instanceof RetryFallbackStrategy) {
      await strategy.waitForRetry();
      return getEnvWithFallback(getEnv, strategy);
    }

    // For other strategies, use fallback values
    // This is a simplified implementation
    // In practice, you'd need to reconstruct the env object with fallbacks
    return undefined;
  }
}
