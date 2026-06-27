import RankingPage from '@/components/RankingPage';
import { getTodayYear } from '@/lib/date';
import { getAppData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getAppData();
  return (
    <RankingPage
      players={data.players}
      games={data.games}
      stats={data.stats}
      initialYear={getTodayYear()}
    />
  );
}
