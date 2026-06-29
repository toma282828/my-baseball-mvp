import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, sessionCookieOptions } from '@/lib/session';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** POST: ログイン（チームID + パスワード） */
export async function POST(request) {
  const body = await request.json();
  const teamId = (body.teamId ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  const password = body.password ?? '';

  if (!teamId || !password) {
    return NextResponse.json({ error: 'チームIDとパスワードを入力してください' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: team } = await supabase
    .from('teams')
    .select('slug, password_hash')
    .eq('slug', teamId)
    .maybeSingle();

  if (!team || !verifyPassword(password, team.password_hash)) {
    return NextResponse.json({ error: 'チームIDまたはパスワードが違います' }, { status: 401 });
  }

  const token = await createSessionToken(team.slug);
  const opts = sessionCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(opts.name, token, opts);
  return res;
}
