/**
 * PublicEnvScript Component
 * 
 * React Server Component that injects client-side environment variables into the page.
 * Must be placed in the root layout's <head> section.
 * 
 * This component reads NEXT_PUBLIC_* variables from process.env (server-side)
 * and injects them into a script tag that sets window.__ENV before React hydration.
 * 
 * @example
 * ```tsx
 * // app/layout.tsx (Server Component)
 * import { PublicEnvScript } from 'next-env-guard/script';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <PublicEnvScript />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */

import { generateEnvScript, validateEnvValues } from './generator';

/**
 * Props for the PublicEnvScript component.
 */
export interface PublicEnvScriptProps {
  /**
   * Optional record of environment variables to inject.
   * If not provided, will attempt to read from process.env on the server.
   * Only variables prefixed with NEXT_PUBLIC_ will be included.
   */
  env?: Record<string, unknown>;

  /**
   * Whether to suppress hydration warnings.
   * Set to true if you expect runtime values to differ from build-time values.
   * @default false
   */
  suppressHydrationWarning?: boolean;

  /**
   * Optional namespace for isolating multiple env instances.
   * If provided, variables will be stored in window.__ENV_${namespace}__
   * Must match the namespace used in createEnv().
   */
  namespace?: string;
}

/**
 * React Server Component that injects client-side environment variables into the page.
 * 
 * This component must be rendered on the server side (in a Server Component).
 * It reads NEXT_PUBLIC_* variables from process.env (server-side) and injects them
 * into a script tag that sets window.__ENV before React hydration.
 * 
 * **Important:**
 * - Must be placed in the `<head>` section of your root layout
 * - Only works as a Server Component (cannot be used in Client Components)
 * - Values are sanitized using JSON.stringify for XSS prevention
 * - Script executes synchronously before React hydration
 * 
 * **Performance:**
 * - Minimal overhead (single script tag)
 * - Values are frozen using Object.freeze() to prevent tampering
 * - Validates values in development mode only
 * 
 * @param props - Component props
 * @param props.env - Optional record of environment variables (if not provided, reads from process.env)
 * @param props.suppressHydrationWarning - Whether to suppress hydration warnings
 * @returns Script element or null if no client variables found
 * 
 * @example
 * ```tsx
 * // app/layout.tsx (Server Component)
 * import { PublicEnvScript } from 'next-env-guard/script';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <PublicEnvScript />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * @public
 */
export function PublicEnvScript({
  env,
  suppressHydrationWarning = false,
  namespace,
}: PublicEnvScriptProps): JSX.Element | null {
  // Get environment variables to inject
  // If env is provided, use it; otherwise read from process.env (server-side only)
  let envVars: Record<string, unknown>;

  if (env) {
    // Filter to only NEXT_PUBLIC_ variables (optimized iteration)
    envVars = {};
    for (const key in env) {
      if (Object.prototype.hasOwnProperty.call(env, key) && key.startsWith('NEXT_PUBLIC_')) {
        envVars[key] = env[key];
      }
    }
  } else if (typeof window === 'undefined' && typeof process !== 'undefined') {
    // Read from process.env (server-side only) - optimized iteration
    envVars = {};
    for (const key in process.env) {
      if (Object.prototype.hasOwnProperty.call(process.env, key) && key.startsWith('NEXT_PUBLIC_')) {
        envVars[key] = process.env[key];
      }
    }
  } else {
    // Client-side fallback (shouldn't happen in Server Component)
    envVars = {};
  }

  // Validate environment variable values
  validateEnvValues(envVars);

  // Generate script content with namespace support
  const scriptContent = Object.keys(envVars).length > 0
    ? generateEnvScript(envVars, namespace)
    : '';

  // Don't render anything if there are no environment variables
  if (!scriptContent) {
    return null;
  }

  // Render script tag with environment variables
  return (
    <script
      id="__NEXT_ENV__"
      suppressHydrationWarning={suppressHydrationWarning}
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
