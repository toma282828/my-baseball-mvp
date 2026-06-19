import { notFound } from 'next/navigation';
import GameDetail from '@/components/GameDetail';
import { getAppData, getGameById, getStatsByGameId } from '@/lib/db';

export default async function GameDetailPage({ params }) {
  const { id } = await params;
  const [game, stats, appData] = await Promise.all([
    getGameById(id),
    getStatsByGameId(id),
    getAppData(),
  ]);
  if (!game) notFound();

  return (
    <GameDetail
      game={game}
      stats={stats}
      players={appData.players}
      teamName={appData.teamName}
    />
  );
}
