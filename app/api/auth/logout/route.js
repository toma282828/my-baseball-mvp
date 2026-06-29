import { NextResponse } from 'next/server';
import { sessionCookieOptions, monthlyAuthCookieOptions } from '@/lib/session';

/** POST: ログアウト */
export async function POST() {
  const sessionOpts = sessionCookieOptions();
  const monthlyOpts = monthlyAuthCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionOpts.name, '', { ...sessionOpts, maxAge: 0 });
  res.cookies.set(monthlyOpts.name, '', { ...monthlyOpts, maxAge: 0 });
  return res;
}
