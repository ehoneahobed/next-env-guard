import { observabilityHooks } from './hooks/observability';

/**
 * Custom error class for environment variable validation errors.
 * Collects all validation errors and provides detailed error messages.
 */
export class EnvValidationError extends Error {
  public readonly errors: Array<{
    key: string;
    message: string;
    received?: unknown;
  }>;

  constructor(errors: Array<{ key: string; message: string; received?: unknown }>) {
    // Optimize error message construction with template literals
    const errorCount = errors.length;
    const errorMessages: string[] = new Array(errorCount);
    
    for (let i = 0; i < errorCount; i++) {
      const err = errors[i];
      let message = `  - ${err.key}: ${err.message}`;
      
      if (err.received !== undefined) {
        const receivedStr = typeof err.received === 'string' 
          ? JSON.stringify(err.received)
          : String(err.received);
        message += ` (received: ${receivedStr})`;
      }
      
      errorMessages[i] = message;
    }

    const message = `❌ Invalid environment variables:\n\n${errorMessages.join('\n')}\n`;
    super(message);
    this.name = 'EnvValidationError';
    this.errors = errors;
    Error.captureStackTrace?.(this, EnvValidationError);

    // Report to observability hooks
    observabilityHooks.reportError(this, { errors });
    observabilityHooks.trackEvent('env.validation.error', { errorCount: errors.length });
  }
}

/**
 * Error thrown when attempting to access server-side environment variables on the client.
 */
export class EnvSecurityError extends Error {
  constructor(variableName: string) {
    // Use template literal for better performance
    const message = `❌ Security Error: Attempted to access server-side environment variable "${variableName}" on the client.

Server-side environment variables can only be accessed in server components, API routes, and server-side code.
If you need this variable on the client, prefix it with "NEXT_PUBLIC_" and add it to the "client" schema.`;
    super(message);
    this.name = 'EnvSecurityError';
    Error.captureStackTrace?.(this, EnvSecurityError);

    // Report to observability hooks
    observabilityHooks.reportError(this, { variableName });
    observabilityHooks.trackEvent('env.security.violation', { variableName });
  }
}

/**
 * Error thrown when client-side environment variables don't have the required NEXT_PUBLIC_ prefix.
 */
export class EnvClientPrefixError extends Error {
  constructor(variableName: string) {
    // Use template literal for better performance
    const message = `❌ Invalid client variable name: "${variableName}"

Client-side environment variables must be prefixed with "NEXT_PUBLIC_" for security.
Please rename "${variableName}" to "NEXT_PUBLIC_${variableName}".`;
    super(message);
    this.name = 'EnvClientPrefixError';
    Error.captureStackTrace?.(this, EnvClientPrefixError);
  }
}

/**
 * Error thrown when accessing environment variables before initialization.
 */
export class EnvNotInitializedError extends Error {
  constructor() {
    // Use template literal for better performance
    const message = `❌ Environment variables not initialized.

Make sure to call createEnv() and export the result.`;
    super(message);
    this.name = 'EnvNotInitializedError';
    Error.captureStackTrace?.(this, EnvNotInitializedError);
  }
}
