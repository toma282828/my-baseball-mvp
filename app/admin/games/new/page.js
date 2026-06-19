import GameForm from '@/components/admin/GameForm';
import { getPlayers } from '@/lib/db';

export default async function NewGamePage() {
  const players = await getPlayers();
  return <GameForm players={players} />;
}
