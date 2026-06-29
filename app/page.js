import RankingPage from '@/components/RankingPage';
import { getTodayYear } from '@/lib/date';
import { getAppData, getCurrentTeamSlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const teamSlug = await getCurrentTeamSlug();
  const data = await getAppData(teamSlug);
  return (
    <RankingPage
      players={data.players}
      games={data.games}
      stats={data.stats}
      initialYear={getTodayYear()}
    />
  );
}
