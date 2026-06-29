import { createClient } from '@supabase/supabase-js';

/** サーバー専用。teams テーブル操作用（SERVICE_ROLE_KEY 優先） */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  // フォールバック: anon key（Supabase で RLS を OFF にしている場合）
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    return createClient(url, anonKey);
  }
  throw new Error('Supabase の環境変数が設定されていません');
}
