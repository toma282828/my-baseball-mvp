const COOKIE_NAME = 'team_session';
const MONTHLY_COOKIE = 'monthly_auth';
const MAX_AGE = 60 * 60 * 24 * 35; // 35日（月跨ぎ対応）

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

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let ok = true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) ok = false;
  }
  return ok;
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
  if (!safeEqual(sig, expected)) return null;
  return slug;
}

/** 今月パスワード確認済みの証明トークン */
export async function createMonthlyAuthToken(teamSlug, yearMonth) {
  const payload = `${teamSlug}:${yearMonth}`;
  const sig = await hmacHex(payload);
  return `${payload}.${sig}`;
}

export async function verifyMonthlyAuthToken(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const colon = payload.lastIndexOf(':');
  if (colon <= 0) return null;
  const teamSlug = payload.slice(0, colon);
  const yearMonth = payload.slice(colon + 1);
  const expected = await hmacHex(payload);
  if (!safeEqual(sig, expected)) return null;
  return { teamSlug, yearMonth };
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // ブラウザを閉じるまで（タブ内のページ移動では維持、リロードは SessionGuard で解除）
  };
}

export function monthlyAuthCookieOptions() {
  return {
    name: MONTHLY_COOKIE,
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

/** 指定チームが今月パスワード確認済みか */
export async function isMonthlyAuthValid(cookieStore, teamSlug, yearMonth) {
  const token = cookieStore.get(MONTHLY_COOKIE)?.value;
  const verified = await verifyMonthlyAuthToken(token);
  return !!(verified && verified.teamSlug === teamSlug && verified.yearMonth === yearMonth);
}

export async function isFullyAuthenticated(cookieStore, yearMonth) {
  const teamSlug = await getTeamSlugFromCookies(cookieStore);
  if (!teamSlug) return null;
  const monthlyOk = await isMonthlyAuthValid(cookieStore, teamSlug, yearMonth);
  if (!monthlyOk) return null;
  return teamSlug;
}

export function normalizeTeamSlug(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}
