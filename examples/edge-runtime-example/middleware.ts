import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from './env';

export function middleware(request: NextRequest) {
  // Edge Runtime - server variables work here
  const apiKey = env.GITHUB_API_KEY;

  // Use the API key for authentication, etc.
  const response = NextResponse.next();
  response.headers.set('x-api-key', apiKey);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
