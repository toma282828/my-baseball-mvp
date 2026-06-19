import GameSearch from '@/components/GameSearch';
import { getAppData } from '@/lib/db';

export default async function GamesPage() {
  const { games, teamName } = await getAppData();
  return <GameSearch games={games} teamName={teamName} />;
}
