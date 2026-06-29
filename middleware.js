import { NextResponse } from 'next/server';
import { verifySessionToken, verifyMonthlyAuthToken } from '@/lib/session';
import { getTokyoYearMonth } from '@/lib/date';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isAuthPath = pathname.startsWith('/auth');

  const token = request.cookies.get('team_session')?.value;
  const teamSlug = await verifySessionToken(token);
  const yearMonth = getTokyoYearMonth();
  const monthlyToken = request.cookies.get('monthly_auth')?.value;
  const monthly = await verifyMonthlyAuthToken(monthlyToken);

  const authed = !!(
    teamSlug &&
    monthly &&
    monthly.teamSlug === teamSlug &&
    monthly.yearMonth === yearMonth
  );

  // 未ログイン → ログイン画面へ（/auth は常に開ける）
  if (!authed && !isAuthPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
