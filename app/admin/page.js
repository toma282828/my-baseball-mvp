import AdminArea from '@/components/admin/AdminArea';
import { getAppData } from '@/lib/db';

export default async function AdminPage() {
  const { players, teamName } = await getAppData();
  return <AdminArea players={players} teamName={teamName} />;
}
