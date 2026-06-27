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
  const supabase = getSupabase();

  const { data, error } = await supabase.from('players').insert({
    name: body.name,
    jersey_num: body.jersey_num,
    jersey_double_zero: body.jersey_double_zero ?? false,
    position: body.position ?? '',
  }).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
