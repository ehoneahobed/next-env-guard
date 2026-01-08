/**
 * Configuration manager for next-env-guard.
 * Provides centralized configuration management with validation.
 * 
 * @internal
 */

import type { CreateEnvConfig } from '../types';
import type { ZodTypeAny } from 'zod';

/**
 * Validates and normalizes configuration options.
 */
export interface ConfigManager {
  /**
   * Validates configuration and returns normalized config.
   */
  validateConfig<
    TServer extends Record<string, ZodTypeAny>,
    TClient extends Record<string, ZodTypeAny>,
  >(config: CreateEnvConfig<TServer, TClient>): NormalizedConfig<TServer, TClient>;

  /**
   * Gets default configuration values.
   */
  getDefaults(): Partial<CreateEnvConfig>;
}

/**
 * Normalized configuration with all defaults applied.
 */
export interface NormalizedConfig<
  TServer extends Record<string, ZodTypeAny>,
  TClient extends Record<string, ZodTypeAny>,
> {
  server: TServer;
  client: TClient;
  runtimeEnv: NodeJS.ProcessEnv;
  skipValidation: boolean;
  namespace: string | undefined;
  runtimeAdapter?: import('../runtime/runtime-adapter').RuntimeAdapter;
}

/**
 * Configuration manager implementation.
 */
export class EnvConfigManager implements ConfigManager {
  private static readonly DEFAULT_NAMESPACE = undefined;
  private static readonly DEFAULT_SKIP_VALIDATION = false;

  validateConfig<
    TServer extends Record<string, ZodTypeAny>,
    TClient extends Record<string, ZodTypeAny>,
  >(config: CreateEnvConfig<TServer, TClient>): NormalizedConfig<TServer, TClient> {
    // Validate namespace if provided
    if (config.namespace !== undefined) {
      if (typeof config.namespace !== 'string') {
        throw new TypeError('namespace must be a string');
      }
      if (config.namespace.trim().length === 0) {
        throw new Error('namespace cannot be empty');
      }
      // Validate namespace format (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(config.namespace)) {
        throw new Error('namespace can only contain alphanumeric characters, underscores, and hyphens');
      }
    }

    // Validate runtimeEnv
    if (!config.runtimeEnv || typeof config.runtimeEnv !== 'object') {
      throw new TypeError('runtimeEnv must be an object');
    }

    return {
      server: (config.server || {}) as TServer,
      client: (config.client || {}) as TClient,
      runtimeEnv: config.runtimeEnv,
      skipValidation: config.skipValidation ?? EnvConfigManager.DEFAULT_SKIP_VALIDATION,
      namespace: config.namespace ?? EnvConfigManager.DEFAULT_NAMESPACE,
      runtimeAdapter: config.runtimeAdapter,
    };
  }

  getDefaults(): Partial<CreateEnvConfig> {
    return {
      skipValidation: EnvConfigManager.DEFAULT_SKIP_VALIDATION,
      namespace: EnvConfigManager.DEFAULT_NAMESPACE,
    };
  }
}

/**
 * Global configuration manager instance.
 */
export const configManager = new EnvConfigManager();
