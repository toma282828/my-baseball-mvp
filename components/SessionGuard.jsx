'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const VISIT_KEY = 'app_visit';

function clearSessionAndGoLogin() {
  sessionStorage.removeItem(VISIT_KEY);
  return fetch('/api/auth/session', { method: 'DELETE' })
    .then(() => { window.location.replace('/auth/login'); });
}

/** ログイン成功後に呼ぶ（このタブでの閲覧を許可） */
export function markVisitActive() {
  sessionStorage.setItem(VISIT_KEY, '1');
}

/** ログアウト時に呼ぶ */
export function clearVisitActive() {
  sessionStorage.removeItem(VISIT_KEY);
}

/** リロード・URL直接アクセス時はログイン画面へ */
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
    const navType = nav?.type;
    const visitActive = sessionStorage.getItem(VISIT_KEY);

    // リロード、またはURLを直接開いた（新タブ・ブックマーク等）→ ログインへ
    if (navType === 'reload' || (navType === 'navigate' && !visitActive)) {
      clearSessionAndGoLogin();
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
