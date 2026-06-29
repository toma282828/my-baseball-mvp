'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('メールアドレスを入力してください'); return; }
    setLoading(true); setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/auth/setup`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⚾ 新規登録</h1>
        {sent ? (
          <div>
            <p className="auth-hint">
              <strong>{email}</strong> に登録用URLを送信しました。<br />
              メールを確認してリンクをタップしてください。
            </p>
          </div>
        ) : (
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
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '送信中...' : '登録用URLを送る'}
            </button>
          </form>
        )}
        <p className="auth-switch">
          すでにアカウントをお持ちの方は <Link href="/auth/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
