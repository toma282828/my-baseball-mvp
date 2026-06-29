'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    setLoading(true); setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) { setError('メールアドレスまたはパスワードが違います'); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⚾ ログイン</h1>
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
          アカウントをお持ちでない方は <Link href="/auth/signup">新規登録</Link>
        </p>
      </div>
    </div>
  );
}
