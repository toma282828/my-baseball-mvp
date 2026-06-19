import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** PUT: 設定を更新（チーム名など） */
export async function PUT(request) {
  const body = await request.json();
  const supabase = getSupabase();

  const { error } = await supabase
    .from('settings')
    .upsert({ key: body.key, value: body.value }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  revalidatePath('/admin');
  return NextResponse.json({ ok: true });
}
