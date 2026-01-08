/**
 * Server-side environment variable utilities.
 * These are used internally to handle server-specific env access.
 */

import type { ZodTypeAny } from 'zod';
import type { ServerEnv } from './types';
import { validateEnv } from './validator';

/**
 * Creates a server-only environment object.
 * This is used internally for server-side validation.
 */
export function createServerEnv<T extends Record<string, ZodTypeAny>>(
  schema: T,
  runtimeEnv: NodeJS.ProcessEnv,
  skipValidation = false,
): ServerEnv<T> {
  if (skipValidation) {
    return Object.fromEntries(
      Object.keys(schema).map((key) => [key, runtimeEnv[key]])
    ) as ServerEnv<T>;
  }

  return validateEnv(schema, runtimeEnv) as ServerEnv<T>;
}
