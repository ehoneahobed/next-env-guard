import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClientEnv } from '../../src/core/client-env';
import { z } from 'zod';
import { mockWindowEnv } from '../../src/core/testing';

describe('Edge Cases - window.__ENV', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    // Mock window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {};
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;
  });

  it('should handle null window.__ENV', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window.__ENV = null;

    const schema = {
      NEXT_PUBLIC_API_URL: z.string().url(),
    };

    expect(() => {
      getClientEnv(schema, {}, false);
    }).toThrow();
  });

  it('should handle undefined window.__ENV', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window.__ENV = undefined;

    const schema = {
      NEXT_PUBLIC_API_URL: z.string().url(),
    };

    expect(() => {
      getClientEnv(schema, {}, false);
    }).toThrow();
  });

  it('should handle array in window.__ENV', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window.__ENV = [];

    const schema = {
      NEXT_PUBLIC_API_URL: z.string().url(),
    };

    expect(() => {
      getClientEnv(schema, {}, false);
    }).toThrow();
  });

  it('should handle empty object in window.__ENV', () => {
    cleanup = mockWindowEnv({});

    const schema = {
      NEXT_PUBLIC_API_URL: z.string().url(),
    };

    expect(() => {
      getClientEnv(schema, {}, false);
    }).toThrow();
  });

  it('should handle namespaced window.__ENV', () => {
    cleanup = mockWindowEnv(
      {
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
      },
      'test',
    );

    const schema = {
      NEXT_PUBLIC_API_URL: z.string().url(),
    };

    const result = getClientEnv(schema, {}, false, 'test');
    expect(result.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');
  });
});
