import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import {
  createSessionToken,
  createMonthlyAuthToken,
  sessionCookieOptions,
  monthlyAuthCookieOptions,
  normalizeTeamSlug,
} from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getTokyoYearMonth } from '@/lib/date';

/** POST: 新規登録（チームID + パスワード） */
export async function POST(request) {
  const body = await request.json();
  const teamId = normalizeTeamSlug(body.teamId ?? '');
  const password = body.password ?? '';

  if (!teamId) return NextResponse.json({ error: 'チームIDを入力してください' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 });

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: 'サーバー設定が未完了です' }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from('teams')
    .select('slug')
    .eq('slug', teamId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'このチームIDはすでに使われています' }, { status: 409 });
  }

  const { error } = await supabase.from('teams').insert({
    slug: teamId,
    email: `${teamId}@team.local`,
    password_hash: hashPassword(password),
    display_name: teamId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const yearMonth = getTokyoYearMonth();
  const sessionToken = await createSessionToken(teamId);
  const monthlyToken = await createMonthlyAuthToken(teamId, yearMonth);
  const sessionOpts = sessionCookieOptions();
  const monthlyOpts = monthlyAuthCookieOptions();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionOpts.name, sessionToken, sessionOpts);
  res.cookies.set(monthlyOpts.name, monthlyToken, monthlyOpts);
  return res;
}
