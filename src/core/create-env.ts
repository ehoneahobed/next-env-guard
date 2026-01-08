import type { ZodTypeAny } from 'zod';
import type {
  CreateEnvConfig,
  MergedEnv,
} from './types';
import { validateClientVariableNames } from './validator';
import { createSecureEnvProxy } from './security';
import { createRuntimeAdapter } from './runtime';
import { configManager } from './config/config-manager';

/**
 * Creates a type-safe and validated environment variable object for Next.js.
 * 
 * This function validates environment variables against Zod schemas and provides
 * type-safe access throughout your application. It enforces strict separation
 * between server-side and client-side environment variables for security.
 * 
 * **Features:**
 * - Type-safe environment variable access with full TypeScript support
 * - Runtime validation using Zod schemas
 * - Automatic server/client separation enforcement
 * - Optimized for performance with caching and minimal overhead
 * 
 * **Performance:**
 * - Runtime detection is cached after first call
 * - Validation errors are batched for better error messages
 * - Proxy handlers are optimized for minimal overhead
 * 
 * @param config - Configuration object with server/client schemas and runtime environment
 * @param config.server - Schema for server-side environment variables (only accessible on server)
 * @param config.client - Schema for client-side environment variables (must have NEXT_PUBLIC_ prefix)
 * @param config.runtimeEnv - The runtime environment object (usually process.env)
 * @param config.skipValidation - Whether to skip validation (useful for build-time)
 * @returns Merged environment object with type-safe access and security enforcement
 * 
 * @throws {EnvClientPrefixError} If any client variable doesn't start with NEXT_PUBLIC_
 * @throws {EnvValidationError} If validation fails (with detailed error messages)
 * 
 * @example
 * ```typescript
 * import { createEnv } from 'next-env-guard';
 * import { z } from 'zod';
 * 
 * export const env = createEnv({
 *   server: {
 *     DATABASE_URL: z.string().url(),
 *     GITHUB_API_KEY: z.string().min(1),
 *   },
 *   client: {
 *     NEXT_PUBLIC_API_URL: z.string().url(),
 *   },
 *   runtimeEnv: process.env,
 * });
 * 
 * // Use in your code:
 * const dbUrl = env.DATABASE_URL; // Type-safe, validated
 * ```
 * 
 * @public
 */
export function createEnv<
  TServer extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
  TClient extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
>(
  config: CreateEnvConfig<TServer, TClient>,
): MergedEnv<TServer, TClient> {
  // Normalize configuration with validation
  const normalizedConfig = configManager.validateConfig(config);

  const { server, client, runtimeEnv, skipValidation, namespace, runtimeAdapter } = normalizedConfig;

  // Validate client variable names have NEXT_PUBLIC_ prefix (only check once)
  const clientKeys = Object.keys(client);
  if (clientKeys.length > 0) {
    validateClientVariableNames(client);
  }

  // Get or create runtime adapter
  const adapter = runtimeAdapter || createRuntimeAdapter();
  const serverKeys = Object.keys(server);

  // Validate server environment variables using adapter
  const serverEnv = adapter.validateServerEnv(
    server,
    runtimeEnv,
    skipValidation,
  );

  // Validate client environment variables using adapter
  const clientEnv = adapter.validateClientEnv(
    client,
    runtimeEnv,
    skipValidation,
    namespace,
  );

  // Merge server and client env objects
  // On client, serverEnv is empty, so we only get clientEnv
  // On server, we get both
  // Use spread operator with explicit property copying to avoid proxy enumeration issues
  // On server, both should be plain objects from validateEnv, so this is safe
  const mergedEnv = {
    ...serverEnv,
    ...(clientEnv as Record<string, unknown>),
  } as MergedEnv<TServer, TClient>;

  // Create a secure proxy that prevents server variable access on the client
  // Use Set for O(1) lookup performance
  const serverKeysSet = new Set(serverKeys);
  const secureEnv = createSecureEnvProxy(mergedEnv, serverKeysSet, namespace);

  return secureEnv;
}
