import { NextResponse } from 'next/server';
import { isMonthlyAuthValid, normalizeTeamSlug } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getTokyoYearMonth } from '@/lib/date';
import { cookies } from 'next/headers';

/** POST: パスワードが必要か確認 */
export async function POST(request) {
  const body = await request.json();
  const teamId = normalizeTeamSlug(body.teamId ?? '');

  if (!teamId) {
    return NextResponse.json({ exists: false, needPassword: false });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: 'サーバー設定が未完了です' }, { status: 500 });
  }

  const { data: team } = await supabase
    .from('teams')
    .select('slug')
    .eq('slug', teamId)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ exists: false, needPassword: false });
  }

  const yearMonth = getTokyoYearMonth();
  const cookieStore = await cookies();
  const monthlyOk = await isMonthlyAuthValid(cookieStore, teamId, yearMonth);

  return NextResponse.json({
    exists: true,
    needPassword: !monthlyOk,
    yearMonth,
  });
}
