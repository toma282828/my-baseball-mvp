import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireTeamSlug } from '@/lib/team';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** PUT: チーム名を更新 */
export async function PUT(request) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.key === 'team_name') {
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ error: 'サーバー設定が未完了です（SERVICE_ROLE_KEY）' }, { status: 500 });
    }
    const { error } = await supabase
      .from('teams')
      .update({ display_name: body.value })
      .eq('slug', teamSlug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
