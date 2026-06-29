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

/** PATCH: 選手情報更新（背番号・ポジションなど） */
export async function PATCH(request, { params }) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabase();

  const { data: owned } = await supabase
    .from('players')
    .select('name')
    .eq('id', id)
    .eq('team_slug', teamSlug)
    .maybeSingle();
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const update = {};
  if (body.jersey_num !== undefined) update.jersey_num = body.jersey_num;
  if (body.jersey_double_zero !== undefined) update.jersey_double_zero = body.jersey_double_zero;
  if (body.position !== undefined) update.position = body.position;
  if (body.name !== undefined) update.name = body.name;

  let oldName = null;
  if (body.name !== undefined && body.name !== owned.name) {
    oldName = owned.name;
  }

  const { error } = await supabase.from('players').update(update).eq('id', id).eq('team_slug', teamSlug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (oldName && body.name) {
    await supabase.from('game_stats')
      .update({ player_name: body.name })
      .eq('player_name', oldName);
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}

/** DELETE: 選手削除 */
export async function DELETE(request, { params }) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from('players').delete().eq('id', id).eq('team_slug', teamSlug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
