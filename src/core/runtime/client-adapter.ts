/**
 * Client-side runtime adapter implementation.
 * Handles validation and access for client-side environment variables from window.__ENV.
 * 
 * @internal
 */

import type { ZodTypeAny } from 'zod';
import type { RuntimeAdapter } from './runtime-adapter';
import type { ServerEnv, ClientEnv } from '../types';
import { createClientEnvProxy } from '../client-env';

/**
 * Global type declaration for namespaced window.__ENV
 */
declare global {
  interface Window {
    __ENV?: Record<string, unknown>;
    [key: string]: unknown;
  }
}

/**
 * Client-side runtime adapter.
 * Uses proxies to read from window.__ENV with lazy validation.
 */
export class ClientRuntimeAdapter implements RuntimeAdapter {
  readonly isServer = false;
  readonly isClient = true;
  readonly isEdgeRuntime = false;

  validateServerEnv<TServer extends Record<string, ZodTypeAny>>(
    _schema: TServer,
    _runtimeEnv: NodeJS.ProcessEnv,
    _skipValidation: boolean,
  ): ServerEnv<TServer> {
    // On client, server env should be empty - validation happens at runtime
    return {} as ServerEnv<TServer>;
  }

  validateClientEnv<TClient extends Record<string, ZodTypeAny>>(
    schema: TClient,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
    namespace?: string,
  ): ClientEnv<TClient> {
    // On client, use proxy that reads from window.__ENV
    // The proxy handles lazy initialization and validation
    return createClientEnvProxy(schema, runtimeEnv, skipValidation, namespace);
  }

  getClientEnvKey(namespace?: string): string {
    return namespace ? `__ENV_${namespace}__` : '__ENV';
  }
}
