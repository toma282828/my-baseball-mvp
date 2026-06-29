import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import {
  createSessionToken,
  createMonthlyAuthToken,
  sessionCookieOptions,
  monthlyAuthCookieOptions,
  isMonthlyAuthValid,
  normalizeTeamSlug,
} from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getTokyoYearMonth } from '@/lib/date';
import { cookies } from 'next/headers';

/** POST: ログイン（通常はチームIDのみ / 月初はパスワードも必要） */
export async function POST(request) {
  const body = await request.json();
  const teamId = normalizeTeamSlug(body.teamId ?? '');
  const password = body.password ?? '';

  if (!teamId) {
    return NextResponse.json({ error: 'チームIDを入力してください' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: 'サーバー設定が未完了です' }, { status: 500 });
  }

  const { data: team } = await supabase
    .from('teams')
    .select('slug, password_hash')
    .eq('slug', teamId)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: 'チームIDが見つかりません' }, { status: 404 });
  }

  const yearMonth = getTokyoYearMonth();
  const cookieStore = await cookies();
  const monthlyOk = await isMonthlyAuthValid(cookieStore, teamId, yearMonth);

  if (!monthlyOk) {
    if (!password) {
      return NextResponse.json(
        { needPassword: true, error: '今月最初のログインのため、パスワードが必要です' },
        { status: 401 }
      );
    }
    if (!verifyPassword(password, team.password_hash)) {
      return NextResponse.json(
        { needPassword: true, error: 'パスワードが違います' },
        { status: 401 }
      );
    }
  }

  const sessionToken = await createSessionToken(team.slug);
  const monthlyToken = await createMonthlyAuthToken(team.slug, yearMonth);
  const sessionOpts = sessionCookieOptions();
  const monthlyOpts = monthlyAuthCookieOptions();

  const res = NextResponse.json({ ok: true, needPassword: false });
  res.cookies.set(sessionOpts.name, sessionToken, sessionOpts);
  res.cookies.set(monthlyOpts.name, monthlyToken, monthlyOpts);
  return res;
}
