import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Only apply middleware to dashboard routes
  if (!path.startsWith('/dashboard')) {
    return NextResponse.next();
  }
  
  // For now, let all dashboard requests through
  // We'll handle authentication in the dashboard component itself
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}; 