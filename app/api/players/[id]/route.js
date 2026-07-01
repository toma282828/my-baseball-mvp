import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { requireTeamSlug } from '@/lib/team';
import { isValidPlayerPosition } from '@/lib/positions';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

async function isJerseyTaken(supabase, teamSlug, jerseyNum, doubleZero, excludeId) {
  const { data: list } = await supabase
    .from('players')
    .select('id, jersey_num, jersey_double_zero')
    .eq('team_slug', teamSlug);

  return (list ?? []).some((p) => {
    if (p.id === excludeId) return false;
    if (doubleZero) return p.jersey_double_zero;
    return !p.jersey_double_zero && p.jersey_num === jerseyNum;
  });
}

/** PATCH: 選手情報更新（名前・背番号など） */
export async function PATCH(request, { params }) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabase();

  const { data: owned } = await supabase
    .from('players')
    .select('name, jersey_num, jersey_double_zero')
    .eq('id', id)
    .eq('team_slug', teamSlug)
    .maybeSingle();
  if (!owned) return NextResponse.json({ error: '選手が見つかりません' }, { status: 404 });

  const update = {};
  const nextName = body.name !== undefined ? body.name.trim() : undefined;
  const nextDoubleZero = body.jersey_double_zero !== undefined
    ? body.jersey_double_zero
    : owned.jersey_double_zero;
  const nextJerseyNum = body.jersey_num !== undefined
    ? body.jersey_num
    : owned.jersey_num;

  if (body.name !== undefined) {
    if (!nextName) return NextResponse.json({ error: '名前を入力してください' }, { status: 400 });
    update.name = nextName;
  }
  if (body.jersey_num !== undefined) update.jersey_num = body.jersey_num;
  if (body.jersey_double_zero !== undefined) update.jersey_double_zero = body.jersey_double_zero;
  if (body.position !== undefined) {
    if (!isValidPlayerPosition(body.position)) {
      return NextResponse.json({ error: 'ポジションが不正です' }, { status: 400 });
    }
    update.position = body.position;
  }

  if (body.jersey_num !== undefined || body.jersey_double_zero !== undefined) {
    const taken = await isJerseyTaken(supabase, teamSlug, nextJerseyNum, nextDoubleZero, id);
    if (taken) {
      return NextResponse.json({ error: 'この背番号はすでに使われています' }, { status: 409 });
    }
  }

  let oldName = null;
  if (nextName !== undefined && nextName !== owned.name) {
    oldName = owned.name;
  }

  const { error } = await supabase.from('players').update(update).eq('id', id).eq('team_slug', teamSlug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (oldName && nextName) {
    const { data: teamGames } = await supabase.from('games').select('id').eq('team_slug', teamSlug);
    const gameIds = (teamGames ?? []).map((g) => g.id);
    if (gameIds.length > 0) {
      await supabase.from('game_stats')
        .update({ player_name: nextName })
        .eq('player_name', oldName)
        .in('game_id', gameIds);
    }
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
