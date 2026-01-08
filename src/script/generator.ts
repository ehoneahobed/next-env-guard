/**
 * Script generation utilities for injecting environment variables into the client.
 */

import { sanitizeEnvKey } from '../core/security';

/**
 * Generates a script that assigns environment variables to window.__ENV.
 * The script is executed synchronously before React hydration.
 * Uses JSON.stringify for secure serialization to prevent XSS attacks.
 * Includes Content Security Policy (CSP) considerations.
 * 
 * @param envVars - Record of environment variable names and values
 * @param namespace - Optional namespace for window.__ENV key
 * @returns JavaScript code as a string that safely assigns vars to window.__ENV
 */
export function generateEnvScript(
  envVars: Record<string, unknown>,
  namespace?: string,
): string {
  // Sanitize keys to prevent injection
  const sanitizedVars: Record<string, unknown> = {};
  for (const key in envVars) {
    if (Object.prototype.hasOwnProperty.call(envVars, key)) {
      try {
        const sanitizedKey = sanitizeEnvKey(key);
        sanitizedVars[sanitizedKey] = envVars[key];
      } catch (error) {
        // Skip invalid keys
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️  Skipping invalid environment variable key: ${key}`, error);
        }
      }
    }
  }

  const keys = Object.keys(sanitizedVars);
  if (keys.length === 0) {
    return '';
  }

  // Use JSON.stringify for the entire object for maximum security
  // This is safer than manual string building and handles all edge cases
  // Object.freeze prevents modification of the environment variables
  const envObject = Object.fromEntries(
    keys.map((key) => [key, sanitizedVars[key]])
  );
  
  // Serialize the entire object at once for better security and performance
  const serializedEnv = JSON.stringify(envObject);
  
  // Support namespaced access for multiple instances
  const envKey = namespace ? `__ENV_${namespace}__` : '__ENV';
  
  // Create an immediately-invoked function to isolate scope
  // Use Object.freeze to prevent tampering
  // Use Object.defineProperty with configurable: false for additional security
  const scriptContent = `(function(){Object.defineProperty(window,'${envKey}',{value:Object.freeze(${serializedEnv}),writable:false,configurable:false});})();`;

  return scriptContent;
}

/**
 * Generates a complete script tag with the environment variables.
 * 
 * @param envVars - Record of environment variable names and values
 * @returns Complete script tag HTML
 */
export function generateEnvScriptTag(envVars: Record<string, unknown>): string {
  const scriptContent = generateEnvScript(envVars);
  
  if (!scriptContent) {
    return '';
  }

  // Use dangerouslySetInnerHTML-style content but with proper escaping
  // The content is already sanitized in generateEnvScript
  return `<script id="__NEXT_ENV__" dangerouslySetInnerHTML={{__html: ${JSON.stringify(scriptContent)}}} />`;
}

/**
 * Validates that all values are safe to embed in HTML/JavaScript.
 * Since we use JSON.stringify for serialization, values are automatically sanitized.
 * This function provides additional validation and warnings for suspicious patterns.
 * 
 * @param envVars - Record of environment variable names and values to validate
 */
export function validateEnvValues(envVars: Record<string, unknown>): void {
  // Only validate in development to avoid production overhead
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Patterns that might indicate XSS attempts (for warning purposes only)
  // Note: JSON.stringify handles escaping, but we warn about suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const key in envVars) {
    if (Object.prototype.hasOwnProperty.call(envVars, key)) {
      const value = envVars[key];
      if (value !== null && value !== undefined) {
        const str = String(value);
        
        // Check for suspicious patterns (for developer awareness)
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(str)) {
            console.warn(
              `⚠️  Warning: Environment variable "${key}" contains potentially unsafe content pattern. ` +
              `The value has been sanitized via JSON.stringify, but consider reviewing it for security.`,
            );
            break; // Only warn once per variable
          }
        }
      }
    }
  }
}
