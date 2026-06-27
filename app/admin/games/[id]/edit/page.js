import { notFound } from 'next/navigation';
import GameForm from '@/components/admin/GameForm';
import { getPlayers, getGameById, getStatsByGameId } from '@/lib/db';

export default async function EditGamePage({ params }) {
  const { id } = await params;
  const [game, players, dbStats] = await Promise.all([
    getGameById(id),
    getPlayers(),
    getStatsByGameId(id),
  ]);
  if (!game) notFound();

  // dbStats をそのまま渡す（GameForm の entryFromStat が変換する）
  return <GameForm players={players} initialGame={game} initialStats={dbStats} />;
}
