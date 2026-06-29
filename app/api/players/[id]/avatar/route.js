import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireTeamSlug } from '@/lib/team';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const MAX_BYTES = 400 * 1024;

/** POST: 選手アイコン画像をアップロード */
export async function POST(request, { params }) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: '画像ファイルを選択してください' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '画像ファイル（JPEG/PNGなど）を選んでください' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: '画像は400KB以下にしてください' }, { status: 400 });
  }

  const base64 = Buffer.from(bytes).toString('base64');
  const avatarUrl = `data:${file.type};base64,${base64}`;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: 'サーバー設定が未完了です' }, { status: 500 });
  }

  const { data: owned } = await supabase
    .from('players')
    .select('id')
    .eq('id', id)
    .eq('team_slug', teamSlug)
    .maybeSingle();

  if (!owned) return NextResponse.json({ error: '選手が見つかりません' }, { status: 404 });

  const { error } = await supabase
    .from('players')
    .update({ avatar_url: avatarUrl })
    .eq('id', id)
    .eq('team_slug', teamSlug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}

/** DELETE: 選手アイコンを削除 */
export async function DELETE(request, { params }) {
  const teamSlug = await requireTeamSlug();
  if (!teamSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: 'サーバー設定が未完了です' }, { status: 500 });
  }

  const { error } = await supabase
    .from('players')
    .update({ avatar_url: null })
    .eq('id', id)
    .eq('team_slug', teamSlug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
