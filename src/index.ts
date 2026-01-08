/**
 * next-env-guard
 * 
 * Type-safe and validated environment variable manager for Next.js.
 */

export { createEnv } from './core/create-env';
export type {
  CreateEnvConfig,
  ServerEnv,
  ClientEnv,
  MergedEnv,
  RuntimeEnv,
} from './core/types';
export {
  EnvValidationError,
  EnvSecurityError,
  EnvClientPrefixError,
  EnvNotInitializedError,
} from './core/errors';
export { detectRuntime, isServer, isClient } from './core/detector';
export { setupObservability } from './core/hooks';
export type {
  EnvLogger,
  EnvTelemetry,
  EnvErrorReporter,
} from './core/hooks';
