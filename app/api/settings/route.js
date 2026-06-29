import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { requireTeamSlug } from '@/lib/team';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** PUT: チーム名を更新 */
export async function PUT(request) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabase();

  if (body.key === 'team_name') {
    const { error } = await supabase
      .from('teams')
      .update({ display_name: body.value })
      .eq('slug', teamSlug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
