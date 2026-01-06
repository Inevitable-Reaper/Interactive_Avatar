import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');

  // Agar user '/avatar' par jaane ki koshish kare aur token na ho
  if (request.nextUrl.pathname.startsWith('/avatar') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Sirf in routes par middleware chalega
export const config = {
  matcher: ['/avatar/:path*'],
};