/**
 * Runtime adapters for different execution environments.
 * 
 * @internal
 */

export type { RuntimeAdapter } from './runtime-adapter';
export { ServerRuntimeAdapter } from './server-adapter';
export { ClientRuntimeAdapter } from './client-adapter';
export { EdgeRuntimeAdapter } from './edge-adapter';

// Import adapters at module level to avoid require() anti-pattern
import type { RuntimeAdapter } from './runtime-adapter';
import { ClientRuntimeAdapter } from './client-adapter';
import { ServerRuntimeAdapter } from './server-adapter';
import { EdgeRuntimeAdapter } from './edge-adapter';

/**
 * Creates the appropriate runtime adapter based on the current environment.
 * 
 * @returns Runtime adapter for the current environment
 */
export function createRuntimeAdapter(): RuntimeAdapter {
  const isClient = typeof window !== 'undefined';
  const isServer = typeof window === 'undefined' && typeof process !== 'undefined';
  
  if (isClient) {
    return new ClientRuntimeAdapter();
  }

  // Check for Edge Runtime
  const isEdgeRuntime = isServer && 
    typeof (globalThis as typeof globalThis & { EdgeRuntime?: unknown }).EdgeRuntime !== 'undefined';

  if (isEdgeRuntime) {
    return new EdgeRuntimeAdapter();
  }

  // Default to server adapter
  return new ServerRuntimeAdapter();
}
