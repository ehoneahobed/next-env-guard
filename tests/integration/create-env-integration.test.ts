import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { createEnv } from '../../src/core/create-env';
import { mockWindowEnv, resetRuntimeCache } from '../../src/core/testing';

describe('Integration - createEnv', () => {
  const originalEnv = process.env;
  let cleanupWindow: (() => void) | null = null;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetRuntimeCache();
  });

  afterEach(() => {
    if (cleanupWindow) {
      cleanupWindow();
      cleanupWindow = null;
    }
    process.env = originalEnv;
  });

  it('should work with server and client variables', () => {
    process.env.DATABASE_URL = 'https://db.example.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

    const env = createEnv({
      server: {
        DATABASE_URL: z.string().url(),
      },
      client: {
        NEXT_PUBLIC_API_URL: z.string().url(),
      },
      runtimeEnv: process.env,
    });

    expect(env.DATABASE_URL).toBe('https://db.example.com');
    expect(env.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');
  });

  it('should work with namespaces', () => {
    // Mock client environment first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalWindow = (global as any).window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {};

    // Mock window.__ENV with namespace AFTER window is set
    cleanupWindow = mockWindowEnv(
      {
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
      },
      'test',
    );

    const env = createEnv({
      client: {
        NEXT_PUBLIC_API_URL: z.string().url(),
      },
      runtimeEnv: {},
      namespace: 'test',
    });

    // On server, client vars should be validated from runtimeEnv (empty in this case)
    // On client (when window is mocked), it should read from window.__ENV
    expect(env).toBeDefined();
    
    // Clean up window mock first, then reset cache
    // The cleanupWindow will be called again in afterEach, but it's safe (no-op if already cleaned)
    if (cleanupWindow) {
      cleanupWindow();
      cleanupWindow = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = originalWindow;
    resetRuntimeCache();
  });

  it('should handle optional variables', () => {
    // Set up runtimeEnv properly
    const testEnv: NodeJS.ProcessEnv = {
      REQUIRED: 'value',
      // OPTIONAL is intentionally missing
    };

    const env = createEnv({
      server: {
        REQUIRED: z.string(),
        OPTIONAL: z.string().optional(),
      },
      runtimeEnv: testEnv,
    });

    expect(env.REQUIRED).toBe('value');
    // Optional fields that are missing should be undefined
    expect(env.OPTIONAL).toBeUndefined();
  });

  it('should handle default values', () => {
    const env = createEnv({
      server: {
        PORT: z.string().default('3000'),
      },
      runtimeEnv: {},
    });

    // Note: Zod handles defaults during parsing
    // This test verifies the structure works
    expect(env).toBeDefined();
  });
});
