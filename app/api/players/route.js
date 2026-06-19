import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** POST: 選手登録 */
export async function POST(request) {
  const body = await request.json();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('[players POST] url:', url ? url.slice(0, 30) + '...' : 'UNDEFINED');
  console.log('[players POST] key:', key ? key.slice(0, 20) + '...' : 'UNDEFINED');

  const supabase = getSupabase();

  const { data, error } = await supabase.from('players').insert({
    name: body.name,
    jersey_num: body.jersey_num,
    jersey_double_zero: body.jersey_double_zero ?? false,
    position: body.position ?? '',
  }).select();

  console.log('[players POST] data:', data);
  console.log('[players POST] error:', error);

  if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });

  revalidatePath('/');
  revalidatePath('/admin');
  return NextResponse.json({ ok: true });
}
