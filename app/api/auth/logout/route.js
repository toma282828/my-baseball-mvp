import { NextResponse } from 'next/server';
import { sessionCookieOptions } from '@/lib/session';

/** POST: ログアウト */
export async function POST() {
  const opts = sessionCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(opts.name, '', { ...opts, maxAge: 0 });
  return res;
}
