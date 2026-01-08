/**
 * Client-side environment variable utilities.
 * These handle reading from window.__ENV and providing type-safe access.
 */

import type { ZodTypeAny } from 'zod';
import type { ClientEnv } from './types';
import { EnvNotInitializedError } from './errors';
import { isClient } from './detector';
import { validateEnv } from './validator';
import { validateWindowEnvIntegrity } from './security';

/**
 * Global type declaration for window.__ENV
 */
declare global {
  interface Window {
    __ENV?: Record<string, unknown>;
  }
}

/**
 * Gets the client environment variables from window.__ENV.
 * Throws if window.__ENV is not available.
 * 
 * @param schema - Zod schema for client environment variables
 * @param runtimeEnv - Optional runtime environment (for fallback)
 * @param skipValidation - Whether to skip validation
 * @param namespace - Optional namespace for window.__ENV key
 * @returns Validated client environment object
 */
export function getClientEnv<T extends Record<string, ZodTypeAny>>(
  schema: T,
  runtimeEnv?: NodeJS.ProcessEnv,
  skipValidation = false,
  namespace?: string,
): ClientEnv<T> {
  if (!isClient()) {
    // On server, return empty object (client vars are injected at runtime)
    return {} as ClientEnv<T>;
  }

  // Try to get from window.__ENV first (runtime injected values)
  // Support namespaced access for multiple instances
  const envKey = namespace ? `__ENV_${namespace}__` : '__ENV';
  let envVars: Record<string, unknown> | undefined;
  
  if (typeof window !== 'undefined') {
    const windowEnv = (window as Record<string, unknown>)[envKey];
    // Handle both undefined and null cases, and ensure it's a plain object
    if (windowEnv !== null && windowEnv !== undefined && typeof windowEnv === 'object' && !Array.isArray(windowEnv)) {
      envVars = windowEnv as Record<string, unknown>;
    }
  }
  
  // Fallback to process.env if window.__ENV is not available
  if (!envVars && runtimeEnv) {
    // Fallback to process.env if window.__ENV is not available
    // Filter to only NEXT_PUBLIC_ variables (optimized iteration)
    envVars = {};
    for (const key in runtimeEnv) {
      if (Object.prototype.hasOwnProperty.call(runtimeEnv, key) && key.startsWith('NEXT_PUBLIC_')) {
        envVars[key] = runtimeEnv[key];
      }
    }
  }

  // If still no env vars, handle gracefully based on environment
  // Defensive check: ensure envVars is an object with keys
  if (!envVars || typeof envVars !== 'object' || Array.isArray(envVars) || Object.keys(envVars).length === 0) {
    // If we have a schema but no values, return empty object (for optional client vars)
    // This allows tests and build-time validation to work
    if (Object.keys(schema).length === 0 || skipValidation) {
      return {} as ClientEnv<T>;
    }
    
    if (process.env.NODE_ENV === 'development') {
      const keyInfo = namespace ? `window.${envKey}` : 'window.__ENV';
      console.warn(
        `⚠️  ${keyInfo} is not available. Make sure to add <PublicEnvScript /> to your root layout.\n` +
        'Falling back to process.env values (may not reflect runtime values).',
      );
      // In development, use runtimeEnv if available (optimized iteration)
      if (runtimeEnv) {
        envVars = {};
        for (const key in runtimeEnv) {
          if (Object.prototype.hasOwnProperty.call(runtimeEnv, key) && key.startsWith('NEXT_PUBLIC_')) {
            envVars[key] = runtimeEnv[key];
          }
        }
        // If still empty after checking runtimeEnv, return empty object in development
        if (Object.keys(envVars).length === 0) {
          return {} as ClientEnv<T>;
        }
      } else {
        // In development, return empty object instead of throwing
        // This allows tests to work without full window.__ENV setup
        return {} as ClientEnv<T>;
      }
    } else {
      // In production, throw error if required vars are missing
      throw new EnvNotInitializedError();
    }
  }

  // Validate window.__ENV integrity if available
  if (typeof window !== 'undefined' && envVars) {
    const envKey = namespace ? `__ENV_${namespace}__` : '__ENV';
    if (!validateWindowEnvIntegrity(envKey) && process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️  Security Warning: window.${envKey} integrity check failed. ` +
        'The environment may have been tampered with.',
      );
    }
  }

  // Validate against schema if not skipping validation
  if (!skipValidation && Object.keys(schema).length > 0) {
    try {
      const validated = validateEnv(schema, envVars as NodeJS.ProcessEnv);
      return validated as ClientEnv<T>;
    } catch (error) {
      // In development, warn but don't fail
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Client environment variable validation failed:', error);
        return envVars as ClientEnv<T>;
      }
      throw error;
    }
  }

  return envVars as ClientEnv<T>;
}

/**
 * Creates a proxy for client environment variables that reads from window.__ENV.
 * The proxy handles lazy initialization and validation.
 * 
 * @param schema - Zod schema for client environment variables
 * @param runtimeEnv - Runtime environment for fallback
 * @param skipValidation - Whether to skip validation
 * @param namespace - Optional namespace for window.__ENV key
 * @returns Proxy object that provides type-safe access to client env vars
 */
export function createClientEnvProxy<T extends Record<string, ZodTypeAny>>(
  schema: T,
  runtimeEnv?: NodeJS.ProcessEnv,
  skipValidation = false,
  namespace?: string,
): ClientEnv<T> {
  // Cache for validated environment variables
  let cachedEnv: ClientEnv<T> | null = null;
  let cachedKeys: string[] | null = null;
  const isDev = process.env.NODE_ENV === 'development';

  // Lazy getter function with cached keys
  const getEnv = (): ClientEnv<T> => {
    if (cachedEnv === null) {
      cachedEnv = getClientEnv(schema, runtimeEnv, skipValidation, namespace);
      // Cache keys array for better performance
      cachedKeys = Object.keys(cachedEnv);
    }
    return cachedEnv;
  };

  // Optimized handler objects
  const handler: ProxyHandler<ClientEnv<T>> = {
    get(_target, prop: string | symbol) {
      // Fast path for string properties
      if (typeof prop === 'string') {
        const env = getEnv();
        const value = env[prop as keyof ClientEnv<T>];
        
        // Only warn in development and if value is undefined
        if (isDev && value === undefined && cachedKeys) {
          console.warn(
            `⚠️  Client environment variable "${prop}" is not defined. ` +
            `Available keys: ${cachedKeys.join(', ')}`,
          );
        }
        
        return value;
      }
      
      // Handle symbol properties (e.g., Symbol.iterator)
      if (prop === Symbol.toPrimitive) {
        return () => '[object ClientEnv]';
      }
      
      return undefined;
    },
    has(_target, prop: string | symbol) {
      if (typeof prop === 'string') {
        // Use cached keys if available for better performance
        if (cachedKeys !== null) {
          return cachedKeys.includes(prop);
        }
        const env = getEnv();
        return prop in env;
      }
      return false;
    },
    ownKeys() {
      // Return cached keys if available
      if (cachedKeys !== null) {
        return cachedKeys;
      }
      const env = getEnv();
      return Object.keys(env);
    },
    getOwnPropertyDescriptor(_target, prop: string | symbol) {
      if (typeof prop === 'string') {
        const env = getEnv();
        if (prop in env) {
          return {
            enumerable: true,
            configurable: true,
            value: env[prop as keyof ClientEnv<T>],
          };
        }
      }
      return undefined;
    },
  };

  return new Proxy({} as ClientEnv<T>, handler);
}
