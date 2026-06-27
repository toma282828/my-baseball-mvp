import AppShell from '@/components/AppShell';
import { getAppData } from '@/lib/db';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'チーム成績',
  description: '草野球チームの成績管理',
};

export default async function RootLayout({ children }) {
  const data = await getAppData();

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
