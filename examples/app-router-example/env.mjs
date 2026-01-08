/**
 * Example environment variable schema for App Router.
 */

import { createEnv } from 'next-env-guard';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    GITHUB_API_KEY: z.string().min(1),
    PORT: z.string().default('3000').transform(Number),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
