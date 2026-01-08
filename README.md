# next-env-guard

Type-safe and validated environment variable manager for Next.js.

## Features

- ✅ **Type Safety**: Full TypeScript support with automatic type inference from Zod schemas
- ✅ **Validation**: Built-in validation using Zod with detailed error messages
- ✅ **Runtime Client Env**: Solve the build-time vs runtime problem for client-side variables
- ✅ **Server/Client Separation**: Strict enforcement of server vs client environment variables
- ✅ **Next.js Integration**: Works seamlessly with App Router and Pages Router
- ✅ **Security**: Prevents accidental exposure of server-side secrets to the client

## Installation

```bash
npm install next-env-guard zod
# or
pnpm add next-env-guard zod
# or
yarn add next-env-guard zod
```

## Quick Start

### 1. Define your environment schema

Create `env.mjs` in your project root:

```typescript
import { createEnv } from 'next-env-guard';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    GITHUB_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
```

### 2. Add PublicEnvScript to your layout

For **App Router** (`app/layout.tsx`):

```tsx
import { PublicEnvScript } from 'next-env-guard/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <PublicEnvScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

For **Pages Router** (`pages/_document.tsx`):

```tsx
import { Html, Head, Main, NextScript } from 'next/document';
import { PublicEnvScript } from 'next-env-guard/script';

export default function Document() {
  return (
    <Html>
      <Head>
        <PublicEnvScript />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### 3. Use environment variables

**In server components or API routes:**

```typescript
import { env } from '@/env';

// Type-safe access - no need for type assertions!
const dbUrl = env.DATABASE_URL; // string, not string | undefined
```

**In client components:**

```typescript
'use client';

import { env } from '@/env';

// This will be the runtime value, not build-time!
const apiUrl = env.NEXT_PUBLIC_API_URL;
```

## Advanced Usage

### Optional Variables

```typescript
export const env = createEnv({
  server: {
    REQUIRED: z.string(),
    OPTIONAL: z.string().optional(),
  },
  runtimeEnv: process.env,
});
```

### Default Values

```typescript
export const env = createEnv({
  server: {
    PORT: z.string().default('3000'),
  },
  runtimeEnv: process.env,
});
```

### Type Coercion

```typescript
export const env = createEnv({
  server: {
    PORT: z.string().transform(Number),
    ENABLED: z.string().transform((val) => val === 'true'),
  },
  runtimeEnv: process.env,
});
```

### Complex Validation

```typescript
import { z } from 'zod';

export const env = createEnv({
  server: {
    PORT: z
      .string()
      .regex(/^\d+$/, 'Must be a number')
      .transform(Number)
      .pipe(z.number().int().min(1).max(65535)),
  },
  runtimeEnv: process.env,
});
```

## CLI Tool

Validate your environment variables without starting the server:

```bash
npx next-env-guard-validate
```

Options:
- `--schema <path>`: Path to env.mjs file (default: ./env.mjs)
- `--format <json|human>`: Output format (default: human)
- `--help`: Show help message

## Security

- Server-side environment variables are **never** exposed to the client
- Attempting to access server variables on the client will throw a runtime error
- Client variables must be prefixed with `NEXT_PUBLIC_`
- All values are sanitized before injection to prevent XSS attacks

## How It Works

1. **Schema Definition**: You define your environment variable schema using Zod
2. **Validation**: Variables are validated at startup (server) or when `window.__ENV` is available (client)
3. **Runtime Injection**: The `PublicEnvScript` component injects client variables into `window.__ENV` at runtime
4. **Type-Safe Access**: The `env` object provides type-safe access with full IntelliSense support

## Performance

This package is optimized for production use:

- **Runtime detection is cached** after first call (no repeated checks)
- **Proxy handlers are optimized** with minimal overhead
- **Validation is batched** for better error messages
- **Bundle size**: < 10KB gzipped
- **Zero runtime overhead** except for initial validation

## Security

- **Server variables are never exposed** to the client
- **Client variables are sanitized** using JSON.stringify to prevent XSS
- **Automatic security checks** prevent accessing server vars on client
- **Strict validation** ensures only valid values are used

## Troubleshooting

### `window.__ENV is not available`

Make sure you've added `<PublicEnvScript />` to your root layout's `<head>` section.

### Type errors with environment variables

Ensure your schema types match your usage. Use Zod's type coercion (`.transform()`) for number/boolean conversion.

### Runtime values not updating

Client-side environment variables are injected at runtime via `PublicEnvScript`. Make sure the script is included in your layout.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Migration Guides

### From dotenv

1. Define your schema in `env.mjs`
2. Replace `process.env.*` with `env.*` throughout your codebase
3. TypeScript will help you find all the places to update!

### From next-runtime-env

1. Replace `RuntimeEnvProvider` with `PublicEnvScript` in your layout
2. Replace `getEnv()` calls with `env.*` property access
3. Define your schema with Zod validation

## Requirements

- Next.js 12+
- React 18+
- Node.js 18+
- TypeScript 5+ (recommended)

## License

MIT
