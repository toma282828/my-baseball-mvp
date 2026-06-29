'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [teamId, setTeamId]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'ログインに失敗しました'); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⚾ ログイン</h1>
        <p className="auth-hint">チームIDとパスワードを入力してください。</p>
        <form onSubmit={handleSubmit}>
          <label className="auth-label">チームID</label>
          <input
            type="text"
            className="auth-input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="例: tigers2026"
            autoComplete="username"
          />
          <label className="auth-label">パスワード</label>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            autoComplete="current-password"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p className="auth-switch">
          初めての方は <Link href="/auth/signup">新規登録</Link>
        </p>
      </div>
    </div>
  );
}
