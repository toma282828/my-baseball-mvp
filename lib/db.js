import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** 全データをまとめて取得（ページ初期表示用） */
export async function getAppData() {
  const supabase = getSupabase();
  const [playersRes, gamesRes, statsRes, settingsRes] = await Promise.all([
    supabase.from('players').select('*').order('jersey_num'),
    supabase.from('games').select('*').order('date', { ascending: false }),
    supabase.from('game_stats').select('*'),
    supabase.from('settings').select('*'),
  ]);

  const settings = Object.fromEntries(
    (settingsRes.data ?? []).map((r) => [r.key, r.value])
  );

  return {
    players: playersRes.data ?? [],
    games: gamesRes.data ?? [],
    stats: statsRes.data ?? [],
    teamName: settings.team_name ?? 'チーム名未設定',
  };
}

/** 試合1件取得 */
export async function getGameById(id) {
  const supabase = getSupabase();
  const { data } = await supabase.from('games').select('*').eq('id', id).single();
  return data ?? null;
}

/** 試合の成績一覧取得 */
export async function getStatsByGameId(gameId) {
  const supabase = getSupabase();
  const { data } = await supabase.from('game_stats').select('*').eq('game_id', gameId);
  return data ?? [];
}

/** 選手一覧取得 */
export async function getPlayers() {
  const supabase = getSupabase();
  const { data } = await supabase.from('players').select('*').order('jersey_num');
  return data ?? [];
}
