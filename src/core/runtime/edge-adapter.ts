/**
 * Edge Runtime adapter implementation.
 * Handles validation and access for Edge Runtime environment.
 * Edge Runtime has limited Node.js APIs available.
 * 
 * @internal
 */

import type { ZodTypeAny } from 'zod';
import type { RuntimeAdapter } from './runtime-adapter';
import type { ServerEnv, ClientEnv } from '../types';
import { validateEnv } from '../validator';

/**
 * Edge Runtime adapter.
 * Similar to server adapter but with Edge Runtime limitations.
 */
export class EdgeRuntimeAdapter implements RuntimeAdapter {
  readonly isServer = true;
  readonly isClient = false;
  readonly isEdgeRuntime = true;

  validateServerEnv<TServer extends Record<string, ZodTypeAny>>(
    schema: TServer,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
  ): ServerEnv<TServer> {
    // Edge Runtime has limited APIs, but validation works the same
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
    // On Edge Runtime (which is server-side), validate client vars
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
