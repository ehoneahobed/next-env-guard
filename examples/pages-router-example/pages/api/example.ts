import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../env';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Server-side access - type-safe!
  const dbUrl = env.DATABASE_URL; // string, not string | undefined

  res.status(200).json({
    message: 'Server-side env access works!',
    // Note: Don't expose server variables in API responses
  });
}
