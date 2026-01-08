import { EnvSecurityError } from './errors';
import { isClient } from './detector';

/**
 * Rate limiter for validation attempts to prevent abuse.
 */
class RateLimiter {
  protected attempts: Map<string, number[]> = new Map();
  protected readonly windowMs: number;
  protected readonly maxAttempts: number;

  constructor(windowMs = 60000, maxAttempts = 100) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  /**
   * Checks if an action is allowed for a given key.
   * 
   * @param key - Unique key for rate limiting
   * @returns True if action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove attempts outside the time window
    const validAttempts = attempts.filter((time) => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return true;
  }

  /**
   * Clears rate limiting data for a key.
   * 
   * @param key - Key to clear
   */
  clear(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Global rate limiter for validation attempts.
 * Includes cleanup mechanism to prevent memory leaks.
 */
class ManagedRateLimiter extends RateLimiter {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(windowMs = 60000, maxAttempts = 100) {
    super(windowMs, maxAttempts);
    // Cleanup old entries every 5 minutes to prevent memory leaks
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldEntries();
      }, 5 * 60000); // Every 5 minutes
    }
  }

  /**
   * Cleans up old entries that are outside the time window.
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter((time) => now - time < this.windowMs);
      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }

  /**
   * Cleans up the interval when no longer needed.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Global rate limiter for validation attempts.
 * Includes automatic cleanup to prevent memory leaks.
 */
const validationRateLimiter = new ManagedRateLimiter(60000, 100); // 100 attempts per minute

/**
 * Sanitizes environment variable keys to prevent injection attacks.
 * 
 * @param key - Environment variable key to sanitize
 * @returns Sanitized key
 * @throws Error if key contains invalid characters
 */
export function sanitizeEnvKey(key: string): string {
  // Only allow alphanumeric, underscores, and hyphens
  // Keys starting with NEXT_PUBLIC_ are already validated separately
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key)) {
    throw new Error(
      `Invalid environment variable key: "${key}". ` +
      'Keys must start with a letter or underscore and contain only alphanumeric characters, underscores, and hyphens.',
    );
  }

  // Prevent keys that could be used for prototype pollution
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    throw new Error(
      `Invalid environment variable key: "${key}". ` +
      'This key is not allowed for security reasons.',
    );
  }

  return key;
}

/**
 * Validates that a server-side environment variable is not being accessed on the client.
 * Throws EnvSecurityError if accessed on the client.
 * 
 * This is a security guard to prevent accidental exposure of server-side secrets
 * to the client-side code. Server variables can only be accessed in:
 * - Server Components
 * - API Routes
 * - Server-side code (middleware, getServerSideProps, etc.)
 * 
 * @param variableName - Name of the environment variable being accessed
 * @param isServerVar - Whether this is a server-side variable
 * @throws {EnvSecurityError} If server variable is accessed on client
 * 
 * @internal
 */
export function validateServerAccess(variableName: string, isServerVar: boolean): void {
  if (isClient() && isServerVar) {
    throw new EnvSecurityError(variableName);
  }
}

/**
 * Validates window.__ENV integrity to prevent tampering.
 * 
 * @param envKey - The key used in window.__ENV
 * @returns True if environment appears valid
 */
export function validateWindowEnvIntegrity(envKey: string): boolean {
  if (typeof window === 'undefined') {
    return true; // Not in browser, skip validation
  }

  const env = (window as Record<string, unknown>)[envKey];
  
  if (!env) {
    return false; // Environment not initialized
  }

  // Check if environment is frozen (prevents tampering)
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, envKey);
    if (descriptor && (descriptor.writable === true || descriptor.configurable === true)) {
      // Environment is not properly secured
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️  Security Warning: window.${envKey} is not properly secured. ` +
          'It should be non-writable and non-configurable.',
        );
      }
      return false;
    }
  } catch {
    // Ignore errors during integrity check
  }

  return true;
}

/**
 * Creates a secure proxy for the environment object that prevents server variable access on the client.
 * Optimized for performance with cached keys and minimal object creation.
 * Includes rate limiting to prevent abuse.
 * 
 * @param env - The environment object to wrap
 * @param serverKeys - Set of server-side environment variable keys
 * @param namespace - Optional namespace for rate limiting
 * @returns Proxy object that prevents server variable access on client
 */
export function createSecureEnvProxy<T extends Record<string, unknown>>(
  env: T,
  serverKeys: Set<string>,
  namespace?: string,
): T {
  if (!isClient()) {
    // On the server, return the env object as-is (no proxy overhead)
    return env;
  }

  // Cache filtered keys for better performance
  let cachedClientKeys: string[] | null = null;
  
  const getClientKeys = (): string[] => {
    if (cachedClientKeys === null) {
      cachedClientKeys = Object.keys(env).filter((key) => !serverKeys.has(key));
    }
    return cachedClientKeys;
  };

  // On the client, create a proxy that prevents access to server variables
  // Use optimized handler with minimal function calls and rate limiting
  const rateLimitKey = namespace ? `env-${namespace}` : 'env-global';
  
  const handler: ProxyHandler<T> = {
    get(target, prop: string | symbol) {
      // Fast path: string props with Set lookup (O(1))
      if (typeof prop === 'string') {
        // Sanitize key to prevent injection
        try {
          sanitizeEnvKey(prop);
        } catch (error) {
          throw new EnvSecurityError(`Invalid key: ${prop}`);
        }

        // Rate limiting check
        if (!validationRateLimiter.isAllowed(`${rateLimitKey}:${prop}`)) {
          throw new Error(
            `Rate limit exceeded for environment variable access: ${prop}. ` +
            'Too many validation attempts.',
          );
        }

        if (serverKeys.has(prop)) {
          throw new EnvSecurityError(prop);
        }
        return target[prop as keyof T];
      }
      // Symbol props pass through
      return target[prop as keyof T];
    },
    has(target, prop: string | symbol) {
      if (typeof prop === 'string') {
        // Use Set.has for O(1) lookup instead of iterating
        return !serverKeys.has(prop) && prop in target;
      }
      return prop in target;
    },
    ownKeys() {
      // Use cached client keys for better performance
      return getClientKeys();
    },
    getOwnPropertyDescriptor(target, prop: string | symbol) {
      if (typeof prop === 'string' && serverKeys.has(prop)) {
        return undefined; // Hide server variables
      }
      return Object.getOwnPropertyDescriptor(target, prop);
    },
  };

  return new Proxy(env, handler) as T;
}
