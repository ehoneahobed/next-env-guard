/**
 * Runtime mocking utilities for testing.
 * Allows testing different runtime scenarios without actual runtime detection.
 * 
 * @internal
 */

import type { ZodTypeAny } from 'zod';
import type { RuntimeAdapter } from '../runtime/runtime-adapter';
import { ServerRuntimeAdapter } from '../runtime/server-adapter';
import { ClientRuntimeAdapter } from '../runtime/client-adapter';
import { EdgeRuntimeAdapter } from '../runtime/edge-adapter';

/**
 * Mock runtime adapter for testing.
 */
export class MockRuntimeAdapter implements RuntimeAdapter {
  constructor(
    public readonly isServer: boolean,
    public readonly isClient: boolean,
    public readonly isEdgeRuntime: boolean,
    private readonly serverAdapter: RuntimeAdapter = new ServerRuntimeAdapter(),
    private readonly clientAdapter: RuntimeAdapter = new ClientRuntimeAdapter(),
    private readonly edgeAdapter: RuntimeAdapter = new EdgeRuntimeAdapter(),
  ) {}

  validateServerEnv<TServer extends Record<string, ZodTypeAny>>(
    schema: TServer,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
  ) {
    if (this.isServer && !this.isEdgeRuntime) {
      return this.serverAdapter.validateServerEnv(schema, runtimeEnv, skipValidation);
    } else if (this.isEdgeRuntime) {
      return this.edgeAdapter.validateServerEnv(schema, runtimeEnv, skipValidation);
    } else {
      return this.clientAdapter.validateServerEnv(schema, runtimeEnv, skipValidation);
    }
  }

  validateClientEnv<TClient extends Record<string, ZodTypeAny>>(
    schema: TClient,
    runtimeEnv: NodeJS.ProcessEnv,
    skipValidation: boolean,
    namespace?: string,
  ) {
    if (this.isClient) {
      return this.clientAdapter.validateClientEnv(schema, runtimeEnv, skipValidation, namespace);
    } else if (this.isServer && !this.isEdgeRuntime) {
      return this.serverAdapter.validateClientEnv(schema, runtimeEnv, skipValidation, namespace);
    } else {
      return this.edgeAdapter.validateClientEnv(schema, runtimeEnv, skipValidation, namespace);
    }
  }

  getClientEnvKey(namespace?: string): string {
    if (this.isClient) {
      return this.clientAdapter.getClientEnvKey(namespace);
    } else if (this.isServer && !this.isEdgeRuntime) {
      return this.serverAdapter.getClientEnvKey(namespace);
    } else {
      return this.edgeAdapter.getClientEnvKey(namespace);
    }
  }
}

/**
 * Creates a mock server runtime adapter.
 */
export function createMockServerAdapter(): MockRuntimeAdapter {
  return new MockRuntimeAdapter(true, false, false);
}

/**
 * Creates a mock client runtime adapter.
 */
export function createMockClientAdapter(): MockRuntimeAdapter {
  return new MockRuntimeAdapter(false, true, false);
}

/**
 * Creates a mock edge runtime adapter.
 */
export function createMockEdgeAdapter(): MockRuntimeAdapter {
  return new MockRuntimeAdapter(true, false, true);
}
