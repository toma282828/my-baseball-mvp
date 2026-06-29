'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetupPage() {
  const router = useRouter();
  const [teamId, setTeamId]   = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!teamId.trim())   { setError('チームIDを入力してください'); return; }
    if (password.length < 6) { setError('パスワードは6文字以上で設定してください'); return; }

    setLoading(true); setError('');
    const supabase = createClient();

    const { error: err } = await supabase.auth.updateUser({
      password,
      data: { team_id: teamId.trim() },
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⚾ 初期設定</h1>
        <p className="auth-hint">チームIDとパスワードを設定してください。</p>
        <form onSubmit={handleSubmit}>
          <label className="auth-label">チームID</label>
          <input
            type="text"
            className="auth-input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="例: tigers2026"
          />
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
            {loading ? '設定中...' : '設定してアプリを開く'}
          </button>
        </form>
      </div>
    </div>
  );
}
