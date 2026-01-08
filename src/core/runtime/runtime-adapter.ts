/**
 * Runtime adapter interface for different execution environments.
 * This abstraction allows swapping implementations for server, client, and edge runtimes.
 * 
 * @internal
 */

import type { ZodTypeAny } from 'zod';
import type { ServerEnv, ClientEnv } from '../types';

/**
 * Runtime adapter interface that abstracts environment-specific behavior.
 */
export interface RuntimeAdapter {
  /**
   * Whether this adapter is running on the server.
   */
  readonly isServer: boolean;

  /**
   * Whether this adapter is running on the client.
   */
  readonly isClient: boolean;

  /**
   * Whether this adapter is running in Edge Runtime.
   */
  readonly isEdgeRuntime: boolean;

  /**
   * Validates and returns server-side environment variables.
   * 
   * @param schema - Server environment variable schema
   * @param runtimeEnv - Runtime environment object
   * @param skipValidation - Whether to skip validation
   * @returns Validated server environment object
   */
  validateServerEnv<TServer extends Record<string, ZodTypeAny>>(
    schema: TServer,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
  ): ServerEnv<TServer>;

  /**
   * Validates and returns client-side environment variables.
   * 
   * @param schema - Client environment variable schema
   * @param runtimeEnv - Runtime environment object
   * @param skipValidation - Whether to skip validation
   * @param namespace - Optional namespace for window.__ENV
   * @returns Validated client environment object
   */
  validateClientEnv<TClient extends Record<string, ZodTypeAny>>(
    schema: TClient,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
    namespace?: string,
  ): ClientEnv<TClient>;

  /**
   * Gets the client environment namespace key for window.__ENV.
   * 
   * @param namespace - Optional namespace
   * @returns The key to use in window.__ENV
   */
  getClientEnvKey(namespace?: string): string;
}
