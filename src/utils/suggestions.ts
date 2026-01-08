/**
 * Error suggestion utilities.
 * Provides helpful suggestions for common environment variable errors.
 */

import type { ZodError } from 'zod';

/**
 * Common environment variable names that might be typos.
 */
const COMMON_VARIABLE_NAMES = [
  'DATABASE_URL',
  'NEXT_PUBLIC_API_URL',
  'NODE_ENV',
  'NEXT_PUBLIC_SITE_URL',
  'API_KEY',
  'JWT_SECRET',
  'SESSION_SECRET',
] as const;

/**
 * Suggests a similar variable name if the provided name looks like a typo.
 */
export function suggestVariableName(providedName: string): string | null {
  // Simple Levenshtein-like distance check
  function distance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  // Find the closest match
  let bestMatch: string | null = null;
  let minDistance = Infinity;

  for (const commonName of COMMON_VARIABLE_NAMES) {
    const dist = distance(providedName.toUpperCase(), commonName.toUpperCase());
    if (dist < minDistance && dist <= 3) { // Only suggest if distance <= 3
      minDistance = dist;
      bestMatch = commonName;
    }
  }

  return bestMatch;
}

/**
 * Generates helpful suggestions for a validation error.
 */
export function generateSuggestions(
  variableName: string,
  error: ZodError,
): string[] {
  const suggestions: string[] = [];

  // Check for missing variable
  const hasRequiredError = error.errors.some(
    (e) => e.code === 'invalid_type' && e.received === 'undefined',
  );

  if (hasRequiredError) {
    suggestions.push(`Make sure ${variableName} is set in your environment variables.`);
    suggestions.push(`Add it to your .env file or export it in your shell.`);

    // Suggest similar variable name if it looks like a typo
    const suggestion = suggestVariableName(variableName);
    if (suggestion && suggestion !== variableName.toUpperCase()) {
      suggestions.push(`Did you mean "${suggestion}"?`);
    }
  }

  // Check for type errors
  const hasTypeError = error.errors.some((e) => e.code === 'invalid_type');
  if (hasTypeError) {
    const expectedType = error.errors.find((e) => e.code === 'invalid_type')?.expected;
    suggestions.push(`Expected ${variableName} to be of type ${expectedType}.`);
  }

  // Check for URL format errors
  const hasUrlError = error.errors.some((e) => e.message.includes('url'));
  if (hasUrlError) {
    suggestions.push(`${variableName} must be a valid URL (e.g., https://example.com).`);
  }

  // Check for missing NEXT_PUBLIC_ prefix
  if (!variableName.startsWith('NEXT_PUBLIC_') && variableName.includes('PUBLIC')) {
    suggestions.push(
      `Client-side variables must be prefixed with "NEXT_PUBLIC_". ` +
      `Did you mean "NEXT_PUBLIC_${variableName}"?`,
    );
  }

  return suggestions;
}

/**
 * Formats error messages with suggestions.
 */
export function formatErrorWithSuggestions(
  variableName: string,
  error: ZodError,
): string {
  const suggestions = generateSuggestions(variableName, error);
  const errorMessages = error.errors.map((e) => e.message).join(', ');

  let message = `❌ Invalid environment variable "${variableName}": ${errorMessages}`;

  if (suggestions.length > 0) {
    message += '\n\n💡 Suggestions:\n';
    suggestions.forEach((suggestion) => {
      message += `  - ${suggestion}\n`;
    });
  }

  return message;
}
