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

async function assertGameOwned(supabase, id, teamSlug) {
  const { data } = await supabase
    .from('games')
    .select('id')
    .eq('id', id)
    .eq('team_slug', teamSlug)
    .maybeSingle();
  return !!data;
}

/** PUT: 試合更新 */
export async function PUT(request, { params }) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { game, stats } = body;

  const supabase = getSupabase();
  if (!(await assertGameOwned(supabase, id, teamSlug))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error: gameErr } = await supabase
    .from('games')
    .update({
      date: game.date,
      opponent: game.opponent,
      ground: game.ground,
      our_score: game.our_score,
      their_score: game.their_score,
      result: game.result,
    })
    .eq('id', id)
    .eq('team_slug', teamSlug);

  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 });

  await supabase.from('game_stats').delete().eq('game_id', id);

  if (stats && stats.length > 0) {
    const rows = stats.map((s) => ({ ...s, game_id: id }));
    const { error: statsErr } = await supabase.from('game_stats').insert(rows);
    if (statsErr) return NextResponse.json({ error: statsErr.message }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}

/** DELETE: 試合削除 */
export async function DELETE(request, { params }) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabase();

  if (!(await assertGameOwned(supabase, id, teamSlug))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await supabase.from('game_stats').delete().eq('game_id', id);

  const { error } = await supabase.from('games').delete().eq('id', id).eq('team_slug', teamSlug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
