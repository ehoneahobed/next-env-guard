import { createEnv } from 'next-env-guard';
import { z } from 'zod';

export const env = createEnv({
  server: {
    GITHUB_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
});
