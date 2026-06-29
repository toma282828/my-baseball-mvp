import { cookies } from 'next/headers';
import AppShell from '@/components/AppShell';
import { getAppData } from '@/lib/db';
import { getTeamSlugFromCookies } from '@/lib/session';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'チーム成績',
  description: '草野球チームの成績管理',
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const teamSlug = await getTeamSlugFromCookies(cookieStore);
  const data = teamSlug ? await getAppData(teamSlug) : { teamName: 'チーム成績' };

  return (
    <html lang="ja">
      <body>
        <AppShell teamName={data.teamName}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
