/**
 * Server-side runtime adapter implementation.
 * Handles validation and access for server-side environment variables.
 * 
 * @internal
 */

import type { ZodTypeAny } from 'zod';
import type { RuntimeAdapter } from './runtime-adapter';
import type { ServerEnv, ClientEnv } from '../types';
import { validateEnv } from '../validator';

/**
 * Server-side runtime adapter.
 * Validates environment variables synchronously on the server.
 */
export class ServerRuntimeAdapter implements RuntimeAdapter {
  readonly isServer = true;
  readonly isClient = false;
  readonly isEdgeRuntime = false;

  validateServerEnv<TServer extends Record<string, ZodTypeAny>>(
    schema: TServer,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
  ): ServerEnv<TServer> {
    if (skipValidation || Object.keys(schema).length === 0) {
      return Object.fromEntries(
        Object.keys(schema).map((key) => [key, runtimeEnv[key]])
      ) as ServerEnv<TServer>;
    }

    return validateEnv(schema, runtimeEnv) as ServerEnv<TServer>;
  }

  validateClientEnv<TClient extends Record<string, ZodTypeAny>>(
    schema: TClient,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
    _namespace?: string,
  ): ClientEnv<TClient> {
    // On server, validate client vars but they'll be injected at runtime via PublicEnvScript
    if (skipValidation || Object.keys(schema).length === 0) {
      return Object.fromEntries(
        Object.keys(schema).map((key) => [key, runtimeEnv[key]])
      ) as ClientEnv<TClient>;
    }

    return validateEnv(schema, runtimeEnv) as ClientEnv<TClient>;
  }

  getClientEnvKey(namespace?: string): string {
    return namespace ? `__ENV_${namespace}__` : '__ENV';
  }
}
