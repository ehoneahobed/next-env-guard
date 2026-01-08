import type { ZodTypeAny, infer as ZodInfer } from 'zod';

/**
 * Branded type for validated server environment variables.
 * This ensures type safety and prevents accidental misuse.
 */
export type ValidatedServerEnv<T> = T & { readonly __brand?: 'ValidatedServerEnv' };

/**
 * Branded type for validated client environment variables.
 * This ensures type safety and prevents accidental misuse.
 */
export type ValidatedClientEnv<T> = T & { readonly __brand?: 'ValidatedClientEnv' };

/**
 * Type utility to infer TypeScript type from a Zod schema.
 */
export type InferZodType<T extends ZodTypeAny> = ZodInfer<T>;

/**
 * Type utility to create a record type from server schema.
 * Returns a branded type for additional type safety.
 */
export type ServerEnv<T extends Record<string, ZodTypeAny>> = ValidatedServerEnv<{
  readonly [K in keyof T]: InferZodType<T[K]>;
}>;

/**
 * Type utility to create a record type from client schema.
 * Returns a branded type for additional type safety.
 */
export type ClientEnv<T extends Record<string, ZodTypeAny>> = ValidatedClientEnv<{
  readonly [K in keyof T]: InferZodType<T[K]>;
}>;

/**
 * Configuration object for createEnv function.
 */
export interface CreateEnvConfig<
  TServer extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
  TClient extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
> {
  /**
   * Schema for server-side environment variables.
   * These variables are only accessible in server components, API routes, and server-side code.
   */
  server?: TServer;

  /**
   * Schema for client-side environment variables.
   * These variables must be prefixed with "NEXT_PUBLIC_" and will be exposed to the browser.
   */
  client?: TClient;

  /**
   * The runtime environment object (usually process.env).
   */
  runtimeEnv: NodeJS.ProcessEnv;

  /**
   * Whether to skip validation (useful for build-time validation).
   * @default false
   */
  skipValidation?: boolean;

  /**
   * Whether to skip type checking (development only).
   * @default false
   */
  skipTypeCheck?: boolean;

  /**
   * Optional namespace for isolating multiple env instances.
   * If provided, client variables will be stored in window.__ENV_${namespace}__
   * @default undefined (uses '__ENV')
   */
  namespace?: string;

  /**
   * Optional runtime adapter (for testing or custom environments).
   * If not provided, will be automatically detected.
   * @internal
   */
  runtimeAdapter?: import('./runtime/runtime-adapter').RuntimeAdapter;
}

/**
 * Merged environment object type combining server and client envs.
 */
export type MergedEnv<
  TServer extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
  TClient extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
> = (TServer extends Record<string, never> ? Record<string, never> : ServerEnv<TServer>) &
  (TClient extends Record<string, never> ? Record<string, never> : ClientEnv<TClient>);

/**
 * Runtime environment detection utilities.
 */
export interface RuntimeEnv {
  /**
   * Check if code is running on the server.
   */
  isServer: boolean;

  /**
   * Check if code is running on the client.
   */
  isClient: boolean;

  /**
   * Check if code is running in Edge Runtime.
   */
  isEdgeRuntime: boolean;
}
