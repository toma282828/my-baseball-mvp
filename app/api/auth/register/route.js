import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/password';
import { createSessionToken, sessionCookieOptions } from '@/lib/session';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function normalizeSlug(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

/** POST: 新規登録（メール + チームID + パスワード） */
export async function POST(request) {
  const body = await request.json();
  const email = (body.email ?? '').trim().toLowerCase();
  const teamId = normalizeSlug(body.teamId ?? '');
  const password = body.password ?? '';

  if (!email) return NextResponse.json({ error: 'メールアドレスを入力してください' }, { status: 400 });
  if (!teamId) return NextResponse.json({ error: 'チームIDを入力してください' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 });

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('teams')
    .select('slug')
    .eq('slug', teamId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'このチームIDはすでに使われています' }, { status: 409 });
  }

  const { error } = await supabase.from('teams').insert({
    slug: teamId,
    email,
    password_hash: hashPassword(password),
    display_name: teamId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const token = await createSessionToken(teamId);
  const opts = sessionCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(opts.name, token, opts);
  return res;
}
