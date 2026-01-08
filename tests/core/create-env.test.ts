import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { createEnv } from '../../src/core/create-env';
import { EnvValidationError, EnvClientPrefixError } from '../../src/core/errors';

describe('createEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env
    process.env = { ...originalEnv };
    // Clear any cached window.__ENV
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__ENV = undefined;
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('server variables', () => {
    it('should validate and return server environment variables', () => {
      process.env.DATABASE_URL = 'https://example.com';
      process.env.API_KEY = 'secret-key';

      const env = createEnv({
        server: {
          DATABASE_URL: z.string().url(),
          API_KEY: z.string().min(1),
        },
        runtimeEnv: process.env,
      });

      expect(env.DATABASE_URL).toBe('https://example.com');
      expect(env.API_KEY).toBe('secret-key');
    });

    it('should throw validation error for missing server variables', () => {
      delete process.env.DATABASE_URL;

      expect(() => {
        createEnv({
          server: {
            DATABASE_URL: z.string().url(),
          },
          runtimeEnv: process.env,
        });
      }).toThrow(EnvValidationError);
    });

    it('should throw validation error for invalid server variables', () => {
      process.env.DATABASE_URL = 'not-a-url';

      expect(() => {
        createEnv({
          server: {
            DATABASE_URL: z.string().url(),
          },
          runtimeEnv: process.env,
        });
      }).toThrow(EnvValidationError);
    });
  });

  describe('client variables', () => {
    it('should validate client variables have NEXT_PUBLIC_ prefix', () => {
      process.env.API_URL = 'https://api.example.com';

      expect(() => {
        createEnv({
          client: {
            API_URL: z.string().url(), // Missing NEXT_PUBLIC_ prefix
          },
          runtimeEnv: process.env,
        });
      }).toThrow(EnvClientPrefixError);
    });

    it('should accept client variables with NEXT_PUBLIC_ prefix', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

      const env = createEnv({
        client: {
          NEXT_PUBLIC_API_URL: z.string().url(),
        },
        runtimeEnv: process.env,
      });

      expect(env.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');
    });
  });

  describe('optional variables', () => {
    it('should handle optional variables', () => {
      const env = createEnv({
        server: {
          REQUIRED: z.string(),
          OPTIONAL: z.string().optional(),
        },
        runtimeEnv: {
          REQUIRED: 'value',
        },
      });

      expect(env.REQUIRED).toBe('value');
      expect(env.OPTIONAL).toBeUndefined();
    });
  });

  describe('default values', () => {
    it('should use default values when variable is missing', () => {
      const env = createEnv({
        server: {
          PORT: z.string().default('3000'),
        },
        runtimeEnv: {},
      });

      expect(env.PORT).toBe('3000');
    });
  });

  describe('type coercion', () => {
    it('should handle number transformation', () => {
      process.env.PORT = '3000';

      const env = createEnv({
        server: {
          PORT: z.string().transform(Number),
        },
        runtimeEnv: process.env,
      });

      expect(typeof env.PORT).toBe('number');
      expect(env.PORT).toBe(3000);
    });

    it('should handle boolean transformation', () => {
      process.env.ENABLED = 'true';

      const env = createEnv({
        server: {
          ENABLED: z.string().transform((val) => val === 'true'),
        },
        runtimeEnv: process.env,
      });

      expect(typeof env.ENABLED).toBe('boolean');
      expect(env.ENABLED).toBe(true);
    });
  });

  describe('skipValidation', () => {
    it('should skip validation when skipValidation is true', () => {
      delete process.env.DATABASE_URL;

      const env = createEnv({
        server: {
          DATABASE_URL: z.string().url(),
        },
        runtimeEnv: process.env,
        skipValidation: true,
      });

      // Should not throw, but value will be undefined
      expect(env.DATABASE_URL).toBeUndefined();
    });
  });
});
