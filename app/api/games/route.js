import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** POST: 試合登録 */
export async function POST(request) {
  const body = await request.json();
  const { game, stats } = body;

  const supabase = getSupabase();

  const { data: gameData, error: gameErr } = await supabase
    .from('games')
    .insert({
      date: game.date,
      opponent: game.opponent,
      ground: game.ground,
      our_score: game.our_score,
      their_score: game.their_score,
      result: game.result,
    })
    .select()
    .single();

  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 });

  if (stats && stats.length > 0) {
    const rows = stats.map((s) => ({ ...s, game_id: gameData.id }));
    const { error: statsErr } = await supabase.from('game_stats').insert(rows);
    if (statsErr) return NextResponse.json({ error: statsErr.message }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/games');
  return NextResponse.json({ id: gameData.id });
}
