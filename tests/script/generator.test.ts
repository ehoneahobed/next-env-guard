import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateEnvScript, validateEnvValues } from '../../src/script/generator';

describe('script generator', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('generateEnvScript', () => {
    it('should generate script for environment variables', () => {
      const envVars = {
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
        NEXT_PUBLIC_SITE_URL: 'https://example.com',
      };

      const script = generateEnvScript(envVars);

      // New format uses Object.defineProperty
      expect(script).toContain('__ENV');
      expect(script).toContain('NEXT_PUBLIC_API_URL');
      expect(script).toContain('https://api.example.com');
      expect(script).toContain('Object.defineProperty');
      expect(script).toContain('Object.freeze');
    });

    it('should return empty string for empty env vars', () => {
      const script = generateEnvScript({});
      expect(script).toBe('');
    });

    it('should sanitize values with special characters', () => {
      const envVars = {
        NEXT_PUBLIC_MESSAGE: "Hello 'World'",
      };

      const script = generateEnvScript(envVars);

      // JSON.stringify properly escapes special characters
      // Single quotes inside a JSON string don't need escaping (only double quotes do)
      // The JSON will be: {"NEXT_PUBLIC_MESSAGE":"Hello 'World'"}
      expect(script).toContain('Hello');
      expect(script).toContain('World');
      // The value should be properly JSON-stringified (single quotes are valid in JSON strings)
      expect(script).toContain("Hello 'World'");
      // Should not contain unescaped dangerous characters
      expect(script).not.toContain('<script');
    });
  });

  describe('validateEnvValues', () => {
    it('should warn for potentially unsafe content', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const envVars = {
        NEXT_PUBLIC_CONTENT: '<script>alert("xss")</script>',
      };

      validateEnvValues(envVars);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not warn for safe content', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const envVars = {
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
      };

      validateEnvValues(envVars);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
