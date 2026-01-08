import { describe, it, expect, vi } from 'vitest';
import { withErrorBoundary, safeExecute } from '../../src/core/error-boundary';
import { EnvValidationError } from '../../src/core/errors';

describe('Error Boundary', () => {
  describe('withErrorBoundary', () => {
    it('should wrap function and handle validation errors', () => {
      const fn = () => {
        throw new EnvValidationError([{ key: 'TEST', message: 'Invalid' }]);
      };

      const wrapped = withErrorBoundary(fn, {
        throwAfterHandle: false,
      });

      expect(wrapped()).toBeUndefined();
    });

    it('should re-throw after handling if configured', () => {
      const fn = () => {
        throw new EnvValidationError([{ key: 'TEST', message: 'Invalid' }]);
      };

      const wrapped = withErrorBoundary(fn, {
        throwAfterHandle: true,
      });

      expect(() => wrapped()).toThrow(EnvValidationError);
    });

    it('should call custom error handler', () => {
      const handler = vi.fn();
      const fn = () => {
        throw new EnvValidationError([{ key: 'TEST', message: 'Invalid' }]);
      };

      const wrapped = withErrorBoundary(fn, {
        onValidationError: handler,
        throwAfterHandle: false,
      });

      wrapped();
      expect(handler).toHaveBeenCalled();
    });

    it('should re-throw unknown errors', () => {
      const fn = () => {
        throw new Error('Unknown error');
      };

      const wrapped = withErrorBoundary(fn);

      expect(() => wrapped()).toThrow('Unknown error');
    });
  });

  describe('safeExecute', () => {
    it('should return fallback on error', () => {
      const fn = () => {
        throw new EnvValidationError([{ key: 'TEST', message: 'Invalid' }]);
      };

      const result = safeExecute(fn, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should return function result on success', () => {
      const fn = () => 'success';

      const result = safeExecute(fn, 'fallback');
      expect(result).toBe('success');
    });

    it('should re-throw unknown errors', () => {
      const fn = () => {
        throw new Error('Unknown error');
      };

      expect(() => safeExecute(fn, 'fallback')).toThrow('Unknown error');
    });
  });
});
