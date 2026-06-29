import { cookies } from 'next/headers';
import { getTeamSlugFromCookies } from '@/lib/session';

export async function requireTeamSlug() {
  const cookieStore = await cookies();
  const slug = await getTeamSlugFromCookies(cookieStore);
  return slug;
}
