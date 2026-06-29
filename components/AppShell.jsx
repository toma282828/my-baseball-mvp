'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/',        label: 'ランキング' },
  { href: '/players', label: '選手一覧' },
  { href: '/games',   label: '試合検索' },
  { href: '/admin',   label: '記録員' },
];

export default function AppShell({ children, teamName }) {
  const pathname = usePathname();
  const router   = useRouter();
  const isAuthPage = pathname.startsWith('/auth');

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app">
      <header>
        <div className="header-bar">
          <div className="header-bar-dots">
            <div className="header-bar-dot" />
            <div className="header-bar-dot" />
            <div className="header-bar-dot" />
          </div>
          <span className="header-bar-title">⚾ BASEBALL STATS v1.0</span>
          <span style={{fontSize:'.72rem',fontWeight:900}}>[ × ]</span>
        </div>
        <h1>⚾ {teamName} 成績</h1>
      </header>
      <nav>
        {NAV.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={active ? 'active' : ''}>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="screen-area">
        <div className="page">
          {children}
          <div style={{textAlign:'center',marginTop:32,paddingBottom:16}}>
            <button onClick={handleLogout}
              style={{background:'none',border:'none',cursor:'pointer',
                color:'var(--ink-muted,#888)',fontSize:'.75rem',textDecoration:'underline'}}>
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
