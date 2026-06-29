'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { markVisitActive } from '@/components/SessionGuard';

export default function LoginPage() {
  const [teamId, setTeamId]         = useState('');
  const [password, setPassword]     = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [teamExists, setTeamExists]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const checkStatus = useCallback(async (id) => {
    const slug = id.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug) {
      setNeedPassword(false);
      setTeamExists(null);
      return;
    }
    const res = await fetch('/api/auth/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: slug }),
    });
    const data = await res.json();
    setTeamExists(data.exists);
    setNeedPassword(!!data.needPassword);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, password: needPassword ? password : undefined }),
      });
      const data = await res.json();

      if (data.needPassword) {
        setNeedPassword(true);
        setError(data.error ?? 'パスワードが必要です');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'ログインに失敗しました');
        setLoading(false);
        return;
      }
      markVisitActive();
      window.location.href = '/';
    } catch {
      setError('通信エラーが発生しました');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⚾ ログイン</h1>
        <p className="auth-hint">
          チームIDを入力してログインします。<br />
          毎月はじめの1回だけパスワードも必要です。
        </p>
        <form onSubmit={handleSubmit}>
          <label className="auth-label">チームID</label>
          <input
            type="text"
            className="auth-input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            onBlur={() => checkStatus(teamId)}
            placeholder="例: tigers2026"
            autoComplete="username"
          />
          {teamExists === false && (
            <p className="auth-error">チームIDが見つかりません</p>
          )}
          {needPassword && (
            <>
              <label className="auth-label">パスワード（今月最初のログイン）</label>
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                autoComplete="current-password"
              />
            </>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading || teamExists === false}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p className="auth-switch">
          初めての方は <Link href="/auth/signup">新規登録（チーム作成）</Link>
        </p>
      </div>
    </div>
  );
}
