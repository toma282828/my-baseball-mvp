const COOKIE_NAME = 'team_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30日

function getSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-session-secret';
}

async function hmacHex(message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(teamSlug) {
  const sig = await hmacHex(teamSlug);
  return `${teamSlug}.${sig}`;
}

export async function verifySessionToken(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const slug = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(slug);
  if (sig.length !== expected.length) return null;
  let ok = true;
  for (let i = 0; i < sig.length; i++) {
    if (sig[i] !== expected[i]) ok = false;
  }
  return ok ? slug : null;
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  };
}

export async function getTeamSlugFromCookies(cookieStore) {
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
