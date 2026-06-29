import { NextResponse } from 'next/server';
import { sessionCookieOptions } from '@/lib/session';

/** DELETE: リロード時用 — ログイン状態のみ解除（今月のパスワード確認は維持） */
export async function DELETE() {
  const opts = sessionCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(opts.name, '', { ...opts, maxAge: 0 });
  return res;
}
