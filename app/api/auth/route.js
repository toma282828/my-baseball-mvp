import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();
  const ok = password === process.env.ADMIN_PASSWORD;
  return NextResponse.json({ ok });
}
