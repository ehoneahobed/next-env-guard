/**
 * Environment mocking utilities for testing.
 * Provides utilities to mock window.__ENV and process.env for testing.
 * 
 * @internal
 */

/**
 * Mocks window.__ENV with provided values.
 * 
 * @param envVars - Environment variables to mock
 * @param namespace - Optional namespace
 * @returns Cleanup function to restore original state
 */
export function mockWindowEnv(
  envVars: Record<string, unknown>,
  namespace?: string,
): () => void {
  if (typeof window === 'undefined') {
    // Not in browser environment, return no-op cleanup
    return () => {};
  }

  const envKey = namespace ? `__ENV_${namespace}__` : '__ENV';
  const original = (window as Record<string, unknown>)[envKey];

  // Set mock environment
  (window as Record<string, unknown>)[envKey] = envVars;

  // Return cleanup function
  // Use a flag to track if cleanup has been called to make it idempotent
  let cleaned = false;
  return () => {
    // Check if already cleaned or window doesn't exist
    if (cleaned || typeof window === 'undefined') {
      cleaned = true;
      return;
    }
    
    cleaned = true;
    
    // Safely restore or delete the property
    try {
      if (original !== undefined) {
        (window as Record<string, unknown>)[envKey] = original;
      } else if (envKey in (window as Record<string, unknown>)) {
        delete (window as Record<string, unknown>)[envKey];
      }
    } catch {
      // Ignore errors if window is no longer accessible
    }
  };
}

/**
 * Mocks process.env with provided values.
 * 
 * @param envVars - Environment variables to mock
 * @returns Cleanup function to restore original state
 */
export function mockProcessEnv(
  envVars: Record<string, string | undefined>,
): () => void {
  if (typeof process === 'undefined') {
    // Not in Node.js environment, return no-op cleanup
    return () => {};
  }

  const original: Record<string, string | undefined> = {};

  // Save original values
  for (const key in envVars) {
    if (Object.prototype.hasOwnProperty.call(envVars, key)) {
      original[key] = process.env[key];
    }
  }

  // Set mock values
  for (const [key, value] of Object.entries(envVars)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  // Return cleanup function
  return () => {
    for (const key in original) {
      if (Object.prototype.hasOwnProperty.call(original, key)) {
        const value = original[key];
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  };
}

/**
 * Clears all window.__ENV values (for cleanup between tests).
 * 
 * @param namespace - Optional namespace to clear
 */
export function clearWindowEnv(namespace?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const envKey = namespace ? `__ENV_${namespace}__` : '__ENV';
  delete (window as Record<string, unknown>)[envKey];
}
