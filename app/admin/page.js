import AdminArea from '@/components/admin/AdminArea';
import { getAppData, getCurrentTeamSlug } from '@/lib/db';

export default async function AdminPage() {
  const teamSlug = await getCurrentTeamSlug();
  const { players, teamName } = await getAppData(teamSlug);
  return <AdminArea players={players} teamName={teamName} />;
}
