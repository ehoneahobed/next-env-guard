import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sanitizeEnvKey, createSecureEnvProxy } from '../../src/core/security';
import { EnvSecurityError } from '../../src/core/errors';

describe('Security - Rate Limiting and Key Sanitization', () => {
  describe('sanitizeEnvKey', () => {
    it('should accept valid keys', () => {
      expect(sanitizeEnvKey('DATABASE_URL')).toBe('DATABASE_URL');
      expect(sanitizeEnvKey('NEXT_PUBLIC_API_URL')).toBe('NEXT_PUBLIC_API_URL');
      expect(sanitizeEnvKey('API_KEY_123')).toBe('API_KEY_123');
      expect(sanitizeEnvKey('my-env-var')).toBe('my-env-var');
    });

    it('should reject invalid keys', () => {
      expect(() => sanitizeEnvKey('__proto__')).toThrow();
      expect(() => sanitizeEnvKey('constructor')).toThrow();
      expect(() => sanitizeEnvKey('prototype')).toThrow();
      expect(() => sanitizeEnvKey('123invalid')).toThrow();
      expect(() => sanitizeEnvKey('invalid key')).toThrow();
      expect(() => sanitizeEnvKey('invalid@key')).toThrow();
    });
  });

  describe('createSecureEnvProxy - Rate Limiting', () => {
    beforeEach(() => {
      // Mock client environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = {};
    });

    afterEach(() => {
      // Restore original window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((global as any).window !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (global as any).window;
      }
    });

    it('should allow normal access', () => {
      const env = {
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
      };
      const serverKeys = new Set<string>();

      const proxy = createSecureEnvProxy(env, serverKeys);
      expect(proxy.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');
    });

    it('should throw security error for server variables on client', () => {
      // Mock client environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = {};

      const env = {
        DATABASE_URL: 'https://db.example.com',
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
      };
      const serverKeys = new Set(['DATABASE_URL']);

      const proxy = createSecureEnvProxy(env, serverKeys);

      expect(() => {
        void proxy.DATABASE_URL;
      }).toThrow(EnvSecurityError);
    });
  });
});
