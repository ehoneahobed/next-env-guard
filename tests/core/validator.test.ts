import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateEnv, validateClientVariableNames } from '../../src/core/validator';
import { EnvValidationError, EnvClientPrefixError } from '../../src/core/errors';

describe('validateEnv', () => {
  it('should validate environment variables successfully', () => {
    const schema = {
      DATABASE_URL: z.string().url(),
      API_KEY: z.string().min(1),
    };

    const runtimeEnv: NodeJS.ProcessEnv = {
      DATABASE_URL: 'https://example.com',
      API_KEY: 'secret-key',
    };

    const result = validateEnv(schema, runtimeEnv);

    expect(result.DATABASE_URL).toBe('https://example.com');
    expect(result.API_KEY).toBe('secret-key');
  });

  it('should throw EnvValidationError for invalid variables', () => {
    const schema = {
      DATABASE_URL: z.string().url(),
    };

    const runtimeEnv: NodeJS.ProcessEnv = {
      DATABASE_URL: 'not-a-url',
    };

    expect(() => {
      validateEnv(schema, runtimeEnv);
    }).toThrow(EnvValidationError);
  });

  it('should collect all errors, not just the first one', () => {
    const schema = {
      DATABASE_URL: z.string().url(),
      API_KEY: z.string().min(5),
      PORT: z.string().transform(Number),
    };

    const runtimeEnv: NodeJS.ProcessEnv = {
      DATABASE_URL: 'not-a-url',
      API_KEY: 'abc', // Too short
      PORT: 'invalid-number',
    };

    try {
      validateEnv(schema, runtimeEnv);
      expect.fail('Should have thrown EnvValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      if (error instanceof EnvValidationError) {
        expect(error.errors.length).toBeGreaterThan(1);
      }
    }
  });
});

describe('validateClientVariableNames', () => {
  it('should pass for valid client variable names', () => {
    const clientSchema = {
      NEXT_PUBLIC_API_URL: z.string(),
      NEXT_PUBLIC_SITE_URL: z.string(),
    };

    expect(() => {
      validateClientVariableNames(clientSchema);
    }).not.toThrow();
  });

  it('should throw for invalid client variable names', () => {
    const clientSchema = {
      API_URL: z.string(), // Missing NEXT_PUBLIC_ prefix
    };

    expect(() => {
      validateClientVariableNames(clientSchema);
    }).toThrow(EnvClientPrefixError);
  });
});
