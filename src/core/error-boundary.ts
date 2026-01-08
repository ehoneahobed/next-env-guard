/**
 * Error boundary utilities for graceful error handling.
 * Provides mechanisms to handle validation errors without crashing the application.
 * 
 * @internal
 */

import { EnvValidationError, EnvSecurityError } from './errors';

/**
 * Error handler function type.
 */
export type ErrorHandler = (error: Error) => void;

/**
 * Error boundary configuration.
 */
export interface ErrorBoundaryConfig {
  /**
   * Custom error handler for validation errors.
   * If provided, will be called instead of throwing.
   */
  onValidationError?: ErrorHandler;

  /**
   * Custom error handler for security errors.
   * If provided, will be called instead of throwing.
   */
  onSecurityError?: ErrorHandler;

  /**
   * Whether to log errors to console.
   * @default true in development, false in production
   */
  logErrors?: boolean;

  /**
   * Whether to throw errors after handling.
   * @default true
   */
  throwAfterHandle?: boolean;
}

/**
 * Default error boundary configuration.
 */
const DEFAULT_CONFIG: ErrorBoundaryConfig = {
  logErrors: process.env.NODE_ENV === 'development',
  throwAfterHandle: true,
};

/**
 * Wraps a function with error boundary handling.
 * 
 * @param fn - Function to wrap
 * @param config - Error boundary configuration
 * @returns Wrapped function with error handling
 */
export function withErrorBoundary<T extends (...args: unknown[]) => unknown>(
  fn: T,
  config: ErrorBoundaryConfig = {},
): T {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof EnvValidationError) {
        if (finalConfig.onValidationError) {
          finalConfig.onValidationError(error);
        } else if (finalConfig.logErrors) {
          console.error('Environment validation error:', error.message);
        }

        if (finalConfig.throwAfterHandle) {
          throw error;
        }

        // Return a safe fallback if not throwing
        return undefined;
      }

      if (error instanceof EnvSecurityError) {
        if (finalConfig.onSecurityError) {
          finalConfig.onSecurityError(error);
        } else if (finalConfig.logErrors) {
          console.error('Environment security error:', error.message);
        }

        if (finalConfig.throwAfterHandle) {
          throw error;
        }

        // Return a safe fallback if not throwing
        return undefined;
      }

      // Re-throw unknown errors
      throw error;
    }
  }) as T;
}

/**
 * Safe execution wrapper that catches and handles errors.
 * 
 * @param fn - Function to execute safely
 * @param fallback - Fallback value to return on error
 * @param config - Error boundary configuration
 * @returns Result of function or fallback value
 */
export function safeExecute<T>(
  fn: () => T,
  fallback: T,
  config: ErrorBoundaryConfig = {},
): T {
  try {
    return fn();
  } catch (error) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    if (error instanceof EnvValidationError || error instanceof EnvSecurityError) {
      if (finalConfig.logErrors) {
        console.error('Environment error:', error.message);
      }

      if (finalConfig.onValidationError && error instanceof EnvValidationError) {
        finalConfig.onValidationError(error);
      } else if (finalConfig.onSecurityError && error instanceof EnvSecurityError) {
        finalConfig.onSecurityError(error);
      }

      return fallback;
    }

    // Re-throw unknown errors
    throw error;
  }
}
