import GameForm from '@/components/admin/GameForm';
import { getPlayers, getCurrentTeamSlug } from '@/lib/db';

export default async function NewGamePage() {
  const teamSlug = await getCurrentTeamSlug();
  const players = await getPlayers(teamSlug);
  return <GameForm players={players} />;
}
