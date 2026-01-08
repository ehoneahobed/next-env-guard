import { createEnv } from 'next-env-guard';
import { z } from 'zod';

// First environment instance
export const appEnv = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
  namespace: 'app',
});

// Second environment instance (isolated)
export const adminEnv = createEnv({
  client: {
    NEXT_PUBLIC_ADMIN_URL: z.string().url(),
  },
  runtimeEnv: process.env,
  namespace: 'admin',
});
