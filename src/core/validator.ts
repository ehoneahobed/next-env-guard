import { z } from 'zod';
import type { ZodTypeAny } from 'zod';
import { EnvValidationError, EnvClientPrefixError } from './errors';
import { sanitizeEnvKey } from './security';

/**
 * Validates that all client-side environment variable names start with NEXT_PUBLIC_.
 * Also sanitizes keys to prevent injection attacks.
 * Optimized to fail fast on first invalid key.
 * 
 * @param clientSchema - Record of client-side environment variable schemas
 * @throws EnvClientPrefixError if any variable name doesn't start with NEXT_PUBLIC_
 */
export function validateClientVariableNames(clientSchema: Record<string, ZodTypeAny>): void {
  // Use for...in for better performance than Object.keys() + iteration
  for (const key in clientSchema) {
    if (Object.prototype.hasOwnProperty.call(clientSchema, key)) {
      // Sanitize key first
      try {
        sanitizeEnvKey(key);
      } catch (error) {
        throw new EnvClientPrefixError(
          error instanceof Error ? error.message : `Invalid key: ${key}`,
        );
      }

      // Then check NEXT_PUBLIC_ prefix
      if (!key.startsWith('NEXT_PUBLIC_')) {
        throw new EnvClientPrefixError(key);
      }
    }
  }
}

/**
 * Validates environment variables against their Zod schemas.
 * Collects all errors and throws a comprehensive error message.
 * Optimized to batch validations and minimize object creation.
 * 
 * @param schema - Record of Zod schemas to validate against
 * @param runtimeEnv - Runtime environment variables to validate
 * @returns Validated environment variables
 * @throws EnvValidationError if validation fails
 */
export function validateEnv<T extends Record<string, ZodTypeAny>>(
  schema: T,
  runtimeEnv: NodeJS.ProcessEnv,
): Record<string, unknown> {
  const schemaKeys = Object.keys(schema);
  const schemaLength = schemaKeys.length;
  
  // Pre-allocate arrays with expected size for better performance
  const errors: Array<{ key: string; message: string; received?: unknown }> = [];
  const result: Record<string, unknown> = {};

  // Optimize: iterate over keys directly to avoid Object.entries overhead
  for (let i = 0; i < schemaLength; i++) {
    const key = schemaKeys[i];
    const zodSchema = schema[key];
    const value = runtimeEnv[key];

    try {
      // Use safeParse to collect all errors instead of failing on first error
      // For optional fields, pass undefined explicitly to allow Zod to handle it
      const parsed = zodSchema.safeParse(value === undefined ? undefined : value);

      if (parsed.success) {
        // Include the key even if value is undefined (for optional fields)
        // This ensures optional fields are present in the result object
        result[key] = parsed.data;
      } else {
        // Extract error messages from Zod error with optimized string building
        const zodError = parsed.error;
        const errorCount = zodError.errors.length;
        const messages: string[] = new Array(errorCount);
        
        for (let j = 0; j < errorCount; j++) {
          const err = zodError.errors[j];
          // Type assertion needed because TypeScript can't narrow the error type
          const errorMessage = (err as { message: string; code?: string }).message;
          const errorCode = (err as { code?: string }).code;
          messages[j] = errorCode ? `${errorMessage} (code: ${errorCode})` : errorMessage;
        }

        errors.push({
          key,
          message: messages.join(', '),
          received: value,
        });
      }
    } catch (error) {
      // Handle unexpected errors during validation
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        key,
        message: `Unexpected validation error: ${errorMessage}`,
        received: value,
      });
    }
  }

  // If there are any errors, throw a comprehensive error
  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  return result;
}

/**
 * Creates a Zod object schema from a record of Zod schemas.
 * 
 * @internal
 * This function is currently unused but kept for potential future use.
 * Consider removing if not needed.
 */
export function createZodObject<T extends Record<string, ZodTypeAny>>(
  schemas: T,
): z.ZodObject<{ [K in keyof T]: ZodTypeAny }> {
  return z.object(schemas as { [K in keyof T]: ZodTypeAny });
}

/**
 * Applies default values from Zod schemas before validation.
 * This ensures that optional fields with defaults are properly handled.
 * 
 * @internal
 * Note: Zod schemas with defaults handle this automatically during parsing,
 * so this function may be redundant. Consider removing if not needed.
 * 
 * @deprecated Zod handles defaults automatically during parsing
 */
export function applyDefaults<T extends Record<string, ZodTypeAny>>(
  schema: T,
  runtimeEnv: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  const envWithDefaults = { ...runtimeEnv };

  for (const key in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, key)) {
      // Check if the schema has a default value
      if (envWithDefaults[key] === undefined || envWithDefaults[key] === '') {
        const zodSchema = schema[key];
        // Note: This is a simplified approach - Zod handles defaults automatically
        // Access internal Zod structure for default values (not part of public API)
        type ZodDefWithDefault = {
          defaultValue?: () => { value: unknown };
        };
        const zodDef = (zodSchema as unknown as { _def?: ZodDefWithDefault })._def;
        const defaultValue = zodDef?.defaultValue?.()?.value;
        if (defaultValue !== undefined) {
          envWithDefaults[key] = String(defaultValue);
        }
      }
    }
  }

  return envWithDefaults;
}
