import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country');

  // Allow only users from Israel


  return NextResponse.next();
}

// Apply to all routes
export const config = {
  matcher: '/:path*',
}; 