'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** リロード時にログイン画面へ戻す */
export default function SessionGuard({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');
  const [ready, setReady] = useState(isAuthPage);

  useEffect(() => {
    if (isAuthPage) {
      setReady(true);
      return;
    }

    const nav = performance.getEntriesByType('navigation')[0];
    if (nav?.type === 'reload') {
      fetch('/api/auth/session', { method: 'DELETE' })
        .then(() => { window.location.replace('/auth/login'); });
      return;
    }

    setReady(true);
  }, [isAuthPage, pathname]);

  if (!ready) {
    return (
      <div className="auth-page">
        <p className="auth-hint" style={{ textAlign: 'center' }}>読み込み中...</p>
      </div>
    );
  }

  return children;
}
