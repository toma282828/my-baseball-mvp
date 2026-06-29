import { notFound } from 'next/navigation';
import GameDetail from '@/components/GameDetail';
import { getAppData, getGameById, getStatsByGameId, getCurrentTeamSlug } from '@/lib/db';

export default async function GameDetailPage({ params }) {
  const { id } = await params;
  const teamSlug = await getCurrentTeamSlug();
  const [game, stats, appData] = await Promise.all([
    getGameById(id, teamSlug),
    getStatsByGameId(id),
    getAppData(teamSlug),
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
