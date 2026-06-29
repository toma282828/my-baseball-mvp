import GameSearch from '@/components/GameSearch';
import { getAppData, getCurrentTeamSlug } from '@/lib/db';

export default async function GamesPage() {
  const teamSlug = await getCurrentTeamSlug();
  const { games, teamName } = await getAppData(teamSlug);
  return <GameSearch games={games} teamName={teamName} />;
}
