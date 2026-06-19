import { notFound } from 'next/navigation';
import GameForm from '@/components/admin/GameForm';
import { getPlayers, getGameById, getStatsByGameId } from '@/lib/db';
import { outsToIp } from '@/lib/stats';

export default async function EditGamePage({ params }) {
  const { id } = await params;
  const [game, players, dbStats] = await Promise.all([
    getGameById(id),
    getPlayers(),
    getStatsByGameId(id),
  ]);
  if (!game) notFound();

  const initialStats = dbStats.map((s) => ({
    player_name: s.player_name,
    showBat: s.ab > 0,
    showPit: s.ip_outs > 0 || !!s.decision,
    bat: { ab: s.ab, s1: s.s1, s2: s.s2, s3: s.s3, hr: s.hr, rbi: s.rbi, sb: s.sb, bb: s.bb },
    pit: { ip: outsToIp(s.ip_outs), so_p: s.so_p, er: s.er, decision: s.decision ?? '' },
  }));

  return <GameForm players={players} initialGame={game} initialStats={initialStats} />;
}
