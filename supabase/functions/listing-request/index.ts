// Plate 450 Diary: receives a directory listing request and emails it to the listing inbox through Resend.
// Deploy with:  supabase functions deploy listing-request --no-verify-jwt
// (--no-verify-jwt because the site's publishable key is not a JWT; this function checks Cloudflare Turnstile itself.)
//
// Secrets (set with `supabase secrets set NAME=value`, never put them in the site files):
//   RESEND_API_KEY     Resend API key (sending access)
//   LISTING_TO         the Resend receiving address, for example listing@xxxx.resend.app
//   TURNSTILE_SECRET   Cloudflare Turnstile secret key (the same one the sign-in uses)
//   LISTING_FROM       optional, default "Plate 450 Diary <no-reply@mail.plate450.com>"
//   ALLOWED_ORIGINS    optional, comma separated, default "https://diary.plate450.com,https://plate450.com"
//   RATE_SALT          optional random text used when hashing visitor IPs for the rate limit
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to every function automatically.

const env = (k: string, d = '') => Deno.env.get(k) ?? d;
const ORIGINS = env('ALLOWED_ORIGINS', 'https://diary.plate450.com,https://plate450.com').split(',').map((s) => s.trim()).filter(Boolean);
const PER_IP_HOUR = 3;      // requests one visitor can send per hour
const ALL_PER_DAY = 40;     // all visitors together per day (keeps the free Resend plan safe)
const MAX_TEXT = 3000;

function cors(origin: string | null) {
  const ok = origin && ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin! : ORIGINS[0] ?? '',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
}
async function sha(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function oneLine(s: unknown, n: number) { return String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/[^\x20-\x7E -￿]/g, '').trim().slice(0, n); }

async function db(path: string, init: RequestInit = {}) {
  const url = env('SUPABASE_URL') + '/rest/v1/' + path, key = env('SUPABASE_SERVICE_ROLE_KEY');
  return fetch(url, { ...init, headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
}
async function countSince(filter: string, sinceIso: string): Promise<number> {
  const r = await db('listing_rate?select=at&' + filter + 'at=gte.' + encodeURIComponent(sinceIso), { method: 'HEAD', headers: { Prefer: 'count=exact', Range: '0-0' } });
  const m = /\/(\d+)$/.exec(r.headers.get('content-range') ?? '');
  return m ? Number(m[1]) : 0;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'method' }, origin);
  if (!origin || !ORIGINS.includes(origin)) return reply(403, { ok: false, error: 'origin' }, origin);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return reply(400, { ok: false, error: 'json' }, origin); }

  // Hidden trap field: people never see it, so a filled one is a bot. Pretend it worked.
  if (typeof b.hp === 'string' && b.hp.trim() !== '') return reply(200, { ok: true }, origin);

  const text = typeof b.text === 'string' ? b.text.replace(/\r\n/g, '\n') : '';
  if (text.length < 40 || text.length > MAX_TEXT || !text.startsWith('PLATE 450 DIARY LISTING REQUEST') || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) return reply(400, { ok: false, error: 'text' }, origin);
  const replyTo = oneLine(b.replyTo, 100);
  if (replyTo && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(replyTo)) return reply(400, { ok: false, error: 'email' }, origin);
  const name = oneLine(b.name, 80) || 'New listing';

  // Cloudflare Turnstile: proves a person, not a script, pressed the button.
  const secret = env('TURNSTILE_SECRET');
  if (secret) {
    const token = typeof b.token === 'string' ? b.token.slice(0, 2100) : '';
    if (!token) return reply(403, { ok: false, error: 'check' }, origin);
    const ip = (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    const form = new URLSearchParams({ secret, response: token }); if (ip) form.set('remoteip', ip);
    try {
      const v = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })).json();
      if (!v.success) return reply(403, { ok: false, error: 'check' }, origin);
    } catch { return reply(502, { ok: false, error: 'check' }, origin); }
  }

  // Rate limit: a few per visitor per hour, and a daily cap for everyone. Only a one-way hash of the IP is kept.
  const ipRaw = (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const ipHash = await sha(env('RATE_SALT') + '|' + ipRaw);
  const hourAgo = new Date(Date.now() - 3600_000).toISOString(), dayAgo = new Date(Date.now() - 86400_000).toISOString();
  try {
    if (await countSince('ip_hash=eq.' + ipHash + '&', hourAgo) >= PER_IP_HOUR) return reply(429, { ok: false, error: 'rate' }, origin);
    if (await countSince('', dayAgo) >= ALL_PER_DAY) return reply(429, { ok: false, error: 'busy' }, origin);
    await db('listing_rate', { method: 'POST', body: JSON.stringify({ ip_hash: ipHash }) });
    db('listing_rate?at=lt.' + encodeURIComponent(new Date(Date.now() - 2 * 86400_000).toISOString()), { method: 'DELETE' }).catch(() => {});
  } catch { return reply(502, { ok: false, error: 'limit' }, origin); }

  const to = env('LISTING_TO'), key = env('RESEND_API_KEY');
  if (!to || !key) return reply(500, { ok: false, error: 'config' }, origin);
  const mail: Record<string, unknown> = {
    from: env('LISTING_FROM', 'Plate 450 Diary <no-reply@mail.plate450.com>'), to: [to],
    subject: 'Listing request: ' + name, text,
  };
  if (replyTo) mail.reply_to = replyTo;
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(mail) });
    if (!r.ok) return reply(502, { ok: false, error: 'send' }, origin);
  } catch { return reply(502, { ok: false, error: 'send' }, origin); }
  return reply(200, { ok: true }, origin);
});
