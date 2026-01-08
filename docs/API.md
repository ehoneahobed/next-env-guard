# API Reference

Complete API documentation for next-env-guard.

## Core API

### `createEnv`

Creates a type-safe and validated environment variable object.

```typescript
function createEnv<
  TServer extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
  TClient extends Record<string, ZodTypeAny> = Record<string, ZodTypeAny>,
>(
  config: CreateEnvConfig<TServer, TClient>,
): MergedEnv<TServer, TClient>
```

#### Parameters

- `config.server` (optional): Schema for server-side environment variables
- `config.client` (optional): Schema for client-side environment variables (must have `NEXT_PUBLIC_` prefix)
- `config.runtimeEnv` (required): Runtime environment object (usually `process.env`)
- `config.skipValidation` (optional): Whether to skip validation (default: `false`)
- `config.namespace` (optional): Namespace for isolating multiple instances

#### Returns

Merged environment object with type-safe access.

#### Throws

- `EnvClientPrefixError`: If client variable doesn't start with `NEXT_PUBLIC_`
- `EnvValidationError`: If validation fails

#### Example

```typescript
import { createEnv } from 'next-env-guard';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
```

## Script API

### `PublicEnvScript`

React Server Component that injects client-side environment variables.

```typescript
function PublicEnvScript(props: PublicEnvScriptProps): JSX.Element | null
```

#### Props

- `env` (optional): Record of environment variables to inject
- `suppressHydrationWarning` (optional): Whether to suppress hydration warnings
- `namespace` (optional): Namespace matching the one used in `createEnv()`

#### Example

```tsx
import { PublicEnvScript } from 'next-env-guard/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <PublicEnvScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Error Classes

### `EnvValidationError`

Thrown when environment variable validation fails.

```typescript
class EnvValidationError extends Error {
  errors: Array<{
    key: string;
    message: string;
    received?: unknown;
  }>;
}
```

### `EnvSecurityError`

Thrown when attempting to access server variables on the client.

```typescript
class EnvSecurityError extends Error
```

### `EnvClientPrefixError`

Thrown when client variable doesn't have `NEXT_PUBLIC_` prefix.

```typescript
class EnvClientPrefixError extends Error
```

### `EnvNotInitializedError`

Thrown when environment variables are not initialized.

```typescript
class EnvNotInitializedError extends Error
```

## Utility Functions

### `detectRuntime`

Detects the current runtime environment.

```typescript
function detectRuntime(): RuntimeEnv
```

### `isServer`

Checks if code is running on the server.

```typescript
function isServer(): boolean
```

### `isClient`

Checks if code is running on the client.

```typescript
function isClient(): boolean
```

## Type Definitions

### `CreateEnvConfig`

Configuration object for `createEnv`.

```typescript
interface CreateEnvConfig<
  TServer extends Record<string, ZodTypeAny>,
  TClient extends Record<string, ZodTypeAny>,
> {
  server?: TServer;
  client?: TClient;
  runtimeEnv: NodeJS.ProcessEnv;
  skipValidation?: boolean;
  namespace?: string;
}
```

### `ServerEnv`

Type for server-side environment variables.

```typescript
type ServerEnv<T extends Record<string, ZodTypeAny>> = {
  readonly [K in keyof T]: InferZodType<T[K]>;
}
```

### `ClientEnv`

Type for client-side environment variables.

```typescript
type ClientEnv<T extends Record<string, ZodTypeAny>> = {
  readonly [K in keyof T]: InferZodType<T[K]>;
}
```

### `MergedEnv`

Type for merged server and client environment variables.

```typescript
type MergedEnv<TServer, TClient> = ServerEnv<TServer> & ClientEnv<TClient>
```

## CLI

### `next-env-guard-validate`

Validates environment variables without starting the server.

```bash
next-env-guard-validate [options]
```

#### Options

- `--schema <path>`: Path to env.mjs file (default: ./env.mjs)
- `--env <path>`: Path to .env file or directory
- `--format <json|human>`: Output format (default: human)
- `--help`: Show help message

#### Example

```bash
next-env-guard-validate --schema ./src/env.mjs --format json
```
