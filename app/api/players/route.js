import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { requireTeamSlug } from '@/lib/team';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** POST: 選手登録 */
export async function POST(request) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabase();

  const doubleZero = body.jersey_double_zero ?? false;
  const jerseyNum = body.jersey_num;

  const { data: list } = await supabase
    .from('players')
    .select('jersey_num, jersey_double_zero')
    .eq('team_slug', teamSlug);

  const taken = (list ?? []).some((p) => {
    if (doubleZero) return p.jersey_double_zero;
    return !p.jersey_double_zero && p.jersey_num === jerseyNum;
  });
  if (taken) {
    return NextResponse.json({ error: 'この背番号はすでに使われています' }, { status: 409 });
  }

  const { error } = await supabase.from('players').insert({
    name: body.name,
    jersey_num: body.jersey_num,
    jersey_double_zero: body.jersey_double_zero ?? false,
    position: body.position ?? '',
    team_slug: teamSlug,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
