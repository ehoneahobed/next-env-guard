# Design Document: A Type-Safe and Validated Environment Variable Manager for Next.js

## 1. Introduction

The management of environment variables in Node.js applications, and particularly in Next.js projects, is a well-documented source of developer friction. The challenges range from a lack of type safety and validation to the complexities of handling build-time versus runtime variables, especially in the context of client-side code. This document outlines the design for a new npm package that aims to solve these problems by providing a type-safe, validated, and runtime-aware environment variable manager specifically tailored for the Next.js ecosystem.

## 2. Core Problems to Be Solved

Our research has identified several key pain points that this package will address:

*   **Lack of Type Safety:** Environment variables are typically accessed as strings, leading to potential runtime errors and the need for manual type coercion.
*   **No Built-in Validation:** There is no standard way to validate the presence or format of environment variables, which can lead to unexpected behavior if they are missing or incorrect.
*   **Build-Time vs. Runtime Confusion in Next.js:** Next.js inlines environment variables prefixed with `NEXT_PUBLIC_` at build time. This means they cannot be changed at runtime, which is a major issue for developers who want to build a single Docker image and deploy it to multiple environments [1].
*   **Security Risks:** The common practice of using `.env` files can lead to security vulnerabilities if secrets are accidentally committed to version control.
*   **Boilerplate and Repetitive Code:** Developers often write the same boilerplate code in every project to handle environment variable loading, parsing, and validation.

## 3. Proposed Solution: A Next.js-Native, Type-Safe Environment Manager

We propose a new npm package, tentatively named `next-env-guard`, that will provide a comprehensive solution to these problems. The package will be built on the following core principles:

*   **Schema-First:** Developers will define a schema for their environment variables using Zod, a popular TypeScript-first schema declaration and validation library.
*   **Type-Safe by Default:** The package will use the Zod schema to generate a fully type-safe `env` object that can be used throughout the application.
*   **Runtime-Aware:** The package will solve the build-time vs. runtime problem in Next.js by implementing a runtime injection strategy for client-side variables.
*   **Secure and Opinionated:** The package will provide clear guidance on how to handle secrets and will discourage anti-patterns like committing `.env` files with sensitive information.

## 4. Detailed Package Design and Features

### 4.1. Schema Definition

Developers will define their environment variable schema in a dedicated file, for example, `env.mjs`. This file will use Zod to define the expected types and validation rules for each variable.

```javascript
// /env.mjs
import { createEnv } from "next-env-guard";
import { z } from "zod";

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

### 4.2. Validation and Type-Safe Access

The `createEnv` function will perform the following actions:

1.  It will validate the `process.env` object against the provided Zod schema at application startup.
2.  If any environment variables are missing or invalid, it will throw a descriptive error message and exit the process.
3.  It will return a fully type-safe `env` object that can be imported and used anywhere in the application.

```javascript
// In a server component or API route
import { env } from "@/env.mjs";

const dbUrl = env.DATABASE_URL; // string, not string | undefined
```

### 4.3. Next.js Integration and Runtime Environment Variables

To solve the build-time vs. runtime problem for client-side variables, the package will provide a `PublicEnvScript` component, similar to the approach used by `next-runtime-env` [2].

1.  **`PublicEnvScript` Component:** This React component will be placed in the root layout of the Next.js application.

    ```javascript
    // app/layout.tsx
    import { PublicEnvScript } from "next-env-guard/script";

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

2.  **Runtime Injection:** On the server, the `PublicEnvScript` component will read the public environment variables (those prefixed with `NEXT_PUBLIC_`) from `process.env` and inject them into a `<script>` tag in the HTML document. This script will assign the variables to a global `window.__ENV` object.

3.  **Client-Side Access:** On the client, the `env` object will be a proxy that reads from the `window.__ENV` object. This ensures that client-side code always has access to the latest runtime environment variables.

```javascript
// In a client component
"use client";

import { env } from "@/env.mjs";

const apiUrl = env.NEXT_PUBLIC_API_URL; // This will be the runtime value
```

### 4.4. Security Considerations

The package will enforce a strict separation between server-side and client-side environment variables. Any attempt to access a server-side variable on the client will result in a runtime error. This, combined with the explicit schema definition, will help prevent accidental exposure of sensitive information.

## 5. Comparison with Existing Solutions

| Feature | `next-env-guard` (Proposed) | `next-runtime-env` | Default Next.js |
| :--- | :--- | :--- | :--- |
| **Type Safety** | ✅ (Built-in with Zod) | ❌ | ❌ |
| **Validation** | ✅ (Built-in with Zod) | ❌ | ❌ |
| **Runtime Client Env** | ✅ | ✅ | ❌ |
| **Server/Client Separation** | ✅ | ❌ | ✅ (via `NEXT_PUBLIC_` prefix) |
| **Ease of Use** | High (single package) | Medium (requires separate validation) | Low (many pitfalls) |

While packages like `next-runtime-env` solve the runtime environment variable problem, they do not address the equally important issues of type safety and validation. Our proposed package will provide a more complete and integrated solution, reducing the need for multiple packages and boilerplate code.

## 6. Conclusion

The proposed `next-env-guard` package has the potential to significantly improve the developer experience of working with environment variables in Next.js. By providing a type-safe, validated, and runtime-aware solution, it will help developers avoid common pitfalls, reduce boilerplate code, and build more robust and secure applications. The clear demand for such a tool, as evidenced by numerous online discussions and the popularity of related packages, suggests that `next-env-guard` could become an essential part of the modern Next.js development stack.

## 7. References

[1] "Runtime environment variables in Next.js - build reusable Docker images," GitHub, accessed January 8, 2026, https://github.com/vercel/next.js/discussions/87229.

[2] "next-runtime-env," npm, accessed January 8, 2026, https://www.npmjs.com/package/next-runtime-env.
