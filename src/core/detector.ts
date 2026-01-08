import type { RuntimeEnv } from './types';

/**
 * Cached runtime detection result.
 * Runtime environment never changes during the lifetime of the application,
 * so we cache the result after first detection.
 */
let cachedRuntime: RuntimeEnv | null = null;

/**
 * Detects the current runtime environment (server, client, or Edge Runtime).
 * Results are cached after the first call since runtime never changes.
 * 
 * @returns Runtime environment information
 */
export function detectRuntime(): RuntimeEnv {
  // Return cached result if available
  if (cachedRuntime !== null) {
    return cachedRuntime;
  }

  // Check if we're in a browser/client environment
  const isClient = typeof window !== 'undefined';

  // Check if we're on the server
  const isServer = typeof window === 'undefined' && typeof process !== 'undefined';

  // Check if we're in Edge Runtime
  // Edge Runtime doesn't have all Node.js APIs available
  // Use type assertion for EdgeRuntime detection (not in standard types)
  const isEdgeRuntime = isServer && 
    typeof (globalThis as typeof globalThis & { EdgeRuntime?: unknown }).EdgeRuntime !== 'undefined';

  // Cache and return result
  cachedRuntime = {
    isServer,
    isClient,
    isEdgeRuntime,
  };

  return cachedRuntime;
}

/**
 * Cached server check result.
 */
let cachedIsServer: boolean | null = null;

/**
 * Check if code is currently running on the server.
 * Result is cached after the first call.
 * 
 * @returns True if running on server, false otherwise
 */
export function isServer(): boolean {
  if (cachedIsServer !== null) {
    return cachedIsServer;
  }
  cachedIsServer = typeof window === 'undefined';
  return cachedIsServer;
}

/**
 * Cached client check result.
 */
let cachedIsClient: boolean | null = null;

/**
 * Check if code is currently running on the client.
 * Result is cached after the first call.
 * 
 * @returns True if running on client, false otherwise
 */
export function isClient(): boolean {
  if (cachedIsClient !== null) {
    return cachedIsClient;
  }
  cachedIsClient = typeof window !== 'undefined';
  return cachedIsClient;
}

/**
 * Resets the cached runtime detection results.
 * This is primarily useful for testing.
 * 
 * @internal
 */
export function resetRuntimeCache(): void {
  cachedRuntime = null;
  cachedIsServer = null;
  cachedIsClient = null;
}
