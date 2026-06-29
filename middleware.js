import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isAuthPath = pathname.startsWith('/auth');

  const token = request.cookies.get('team_session')?.value;
  const teamSlug = await verifySessionToken(token);

  if (!teamSlug && !isAuthPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (teamSlug && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
