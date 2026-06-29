import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getTeamSlugFromCookies } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  );
}

export async function getCurrentTeamSlug() {
  const cookieStore = await cookies();
  return getTeamSlugFromCookies(cookieStore);
}

/** 全データをまとめて取得（ページ初期表示用） */
export async function getAppData(teamSlug) {
  const supabase = getSupabase();

  const [playersRes, gamesRes] = await Promise.all([
    supabase.from('players').select('*').eq('team_slug', teamSlug).order('jersey_num'),
    supabase.from('games').select('*').eq('team_slug', teamSlug).order('date', { ascending: false }),
  ]);

  let displayName = teamSlug;
  try {
    const admin = getSupabaseAdmin();
    const { data: team } = await admin.from('teams').select('display_name').eq('slug', teamSlug).maybeSingle();
    if (team?.display_name) displayName = team.display_name;
  } catch {
    // SERVICE_ROLE_KEY 未設定時は slug を表示名に使う
  }

  const games = gamesRes.data ?? [];
  const gameIds = games.map((g) => g.id);

  let stats = [];
  if (gameIds.length > 0) {
    const { data } = await supabase.from('game_stats').select('*').in('game_id', gameIds);
    stats = data ?? [];
  }

  return {
    players: playersRes.data ?? [],
    games,
    stats,
    teamName: displayName,
  };
}

/** 試合1件取得 */
export async function getGameById(id, teamSlug) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .eq('team_slug', teamSlug)
    .maybeSingle();
  return data ?? null;
}

/** 試合の成績一覧取得 */
export async function getStatsByGameId(gameId) {
  const supabase = getSupabase();
  const { data } = await supabase.from('game_stats').select('*').eq('game_id', gameId);
  return data ?? [];
}

/** 選手一覧取得 */
export async function getPlayers(teamSlug) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('team_slug', teamSlug)
    .order('jersey_num');
  return data ?? [];
}
