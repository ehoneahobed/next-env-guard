import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ServerRuntimeAdapter } from '../../src/core/runtime/server-adapter';
import { ClientRuntimeAdapter } from '../../src/core/runtime/client-adapter';
import { EdgeRuntimeAdapter } from '../../src/core/runtime/edge-adapter';

describe('Runtime Adapters', () => {
  describe('ServerRuntimeAdapter', () => {
    const adapter = new ServerRuntimeAdapter();

    it('should have correct runtime flags', () => {
      expect(adapter.isServer).toBe(true);
      expect(adapter.isClient).toBe(false);
      expect(adapter.isEdgeRuntime).toBe(false);
    });

    it('should validate server environment variables', () => {
      const schema = {
        DATABASE_URL: z.string().url(),
      };

      const runtimeEnv: NodeJS.ProcessEnv = {
        DATABASE_URL: 'https://example.com',
      };

      const result = adapter.validateServerEnv(schema, runtimeEnv, false);
      expect(result.DATABASE_URL).toBe('https://example.com');
    });

    it('should validate client environment variables on server', () => {
      const schema = {
        NEXT_PUBLIC_API_URL: z.string().url(),
      };

      const runtimeEnv: NodeJS.ProcessEnv = {
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
      };

      const result = adapter.validateClientEnv(schema, runtimeEnv, false);
      expect(result.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');
    });

    it('should return correct client env key', () => {
      expect(adapter.getClientEnvKey()).toBe('__ENV');
      expect(adapter.getClientEnvKey('test')).toBe('__ENV_test__');
    });
  });

  describe('ClientRuntimeAdapter', () => {
    const adapter = new ClientRuntimeAdapter();

    it('should have correct runtime flags', () => {
      expect(adapter.isServer).toBe(false);
      expect(adapter.isClient).toBe(true);
      expect(adapter.isEdgeRuntime).toBe(false);
    });

    it('should return empty server env on client', () => {
      const schema = {
        DATABASE_URL: z.string().url(),
      };

      const result = adapter.validateServerEnv(schema, {}, false);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should return correct client env key', () => {
      expect(adapter.getClientEnvKey()).toBe('__ENV');
      expect(adapter.getClientEnvKey('test')).toBe('__ENV_test__');
    });
  });

  describe('EdgeRuntimeAdapter', () => {
    const adapter = new EdgeRuntimeAdapter();

    it('should have correct runtime flags', () => {
      expect(adapter.isServer).toBe(true);
      expect(adapter.isClient).toBe(false);
      expect(adapter.isEdgeRuntime).toBe(true);
    });

    it('should validate server environment variables', () => {
      const schema = {
        DATABASE_URL: z.string().url(),
      };

      const runtimeEnv: NodeJS.ProcessEnv = {
        DATABASE_URL: 'https://example.com',
      };

      const result = adapter.validateServerEnv(schema, runtimeEnv, false);
      expect(result.DATABASE_URL).toBe('https://example.com');
    });
  });
});
