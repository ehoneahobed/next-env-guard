import { describe, it, expect, beforeEach } from 'vitest';
import { createSecureEnvProxy, validateServerAccess } from '../../src/core/security';
import { EnvSecurityError } from '../../src/core/errors';
import { resetRuntimeCache } from '../../src/core/detector';

describe('security', () => {
  beforeEach(() => {
    // Reset runtime cache before each test
    resetRuntimeCache();
  });

  describe('validateServerAccess', () => {
    it('should not throw on server', () => {
      // Mock server environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalWindow = (global as any).window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = undefined;
      resetRuntimeCache();

      expect(() => {
        validateServerAccess('DATABASE_URL', true);
      }).not.toThrow();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = originalWindow;
      resetRuntimeCache();
    });

    it('should throw on client for server variables', () => {
      // Mock client environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalWindow = (global as any).window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = {};
      resetRuntimeCache();

      expect(() => {
        validateServerAccess('DATABASE_URL', true);
      }).toThrow(EnvSecurityError);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = originalWindow;
      resetRuntimeCache();
    });
  });

  describe('createSecureEnvProxy', () => {
    it('should allow access to client variables on client', () => {
      // Mock client environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalWindow = (global as any).window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = {};
      resetRuntimeCache();

      const env = {
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
        DATABASE_URL: 'https://db.example.com',
      };

      const serverKeys = new Set(['DATABASE_URL']);
      const proxy = createSecureEnvProxy(env, serverKeys);

      // Should allow access to client variable
      expect(proxy.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');

      // Should throw for server variable
      expect(() => {
        void proxy.DATABASE_URL;
      }).toThrow(EnvSecurityError);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = originalWindow;
      resetRuntimeCache();
    });

    it('should allow access to all variables on server', () => {
      // Mock server environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalWindow = (global as any).window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = undefined;
      resetRuntimeCache();

      const env = {
        DATABASE_URL: 'https://db.example.com',
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
      };

      const serverKeys = new Set(['DATABASE_URL']);
      const proxy = createSecureEnvProxy(env, serverKeys);

      // Should allow access to both on server
      expect(proxy.DATABASE_URL).toBe('https://db.example.com');
      expect(proxy.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = originalWindow;
      resetRuntimeCache();
    });
  });
});
