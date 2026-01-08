import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { configManager } from '../../src/core/config/config-manager';

describe('ConfigManager', () => {
  describe('validateConfig', () => {
    it('should validate and normalize config', () => {
      const config = {
        server: {
          DATABASE_URL: z.string().url(),
        },
        runtimeEnv: {
          DATABASE_URL: 'https://example.com',
        },
      };

      const normalized = configManager.validateConfig(config);

      expect(normalized.server).toBeDefined();
      expect(normalized.client).toBeDefined();
      expect(normalized.skipValidation).toBe(false);
      expect(normalized.namespace).toBeUndefined();
    });

    it('should validate namespace format', () => {
      const config = {
        runtimeEnv: {},
        namespace: 'valid-namespace_123',
      };

      expect(() => {
        configManager.validateConfig(config);
      }).not.toThrow();
    });

    it('should reject invalid namespace', () => {
      const config = {
        runtimeEnv: {},
        namespace: 'invalid namespace',
      };

      expect(() => {
        configManager.validateConfig(config);
      }).toThrow();

      const config2 = {
        runtimeEnv: {},
        namespace: '',
      };

      expect(() => {
        configManager.validateConfig(config2);
      }).toThrow();
    });

    it('should reject invalid runtimeEnv', () => {
      const config = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        runtimeEnv: null as any,
      };

      expect(() => {
        configManager.validateConfig(config);
      }).toThrow();
    });
  });

  describe('getDefaults', () => {
    it('should return default configuration', () => {
      const defaults = configManager.getDefaults();

      expect(defaults.skipValidation).toBe(false);
      expect(defaults.namespace).toBeUndefined();
    });
  });
});
