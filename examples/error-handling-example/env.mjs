import { createEnv } from 'next-env-guard';
import { z } from 'zod';
import { withErrorBoundary, safeExecute } from 'next-env-guard/core/error-boundary';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});

// Example: Wrap env access with error boundary
export const safeGetEnv = withErrorBoundary(
  () => env,
  {
    onValidationError: (error) => {
      // Log to error reporting service
      console.error('Env validation error:', error);
    },
    throwAfterHandle: false,
  },
);

// Example: Safe execution with fallback
export function getApiUrl(): string {
  return safeExecute(
    () => env.NEXT_PUBLIC_API_URL,
    'https://api.example.com', // fallback
  );
}
