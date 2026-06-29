'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [teamId, setTeamId]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, teamId, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? '登録に失敗しました'); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⚾ 新規登録</h1>
        <p className="auth-hint">チームの記録員が最初に1回だけ登録します。</p>
        <form onSubmit={handleSubmit}>
          <label className="auth-label">メールアドレス</label>
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="例: baseball@example.com"
            autoComplete="email"
          />
          <label className="auth-label">チームID</label>
          <input
            type="text"
            className="auth-input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="例: tigers2026"
            autoComplete="username"
          />
          <p className="auth-hint" style={{ marginTop: 4 }}>
            ログイン時に使うIDです。メンバー全員で共有します。
          </p>
          <label className="auth-label">パスワード（6文字以上）</label>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを設定"
            autoComplete="new-password"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '登録中...' : '登録してアプリを開く'}
          </button>
        </form>
        <p className="auth-switch">
          すでに登録済みの方は <Link href="/auth/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
