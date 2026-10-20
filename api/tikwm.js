/* AbuNawaf hardened — © 2026 أبو نواف · MIT */
const __RL = new Map();
function __rate(req, res, max = 90, win = 60_000) {
  try {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'x';
    const key = ip + ':' + (req.url || '');
    const now = Date.now();
    const b = __RL.get(key);
    if (!b || now > b.r) { __RL.set(key, { n: 1, r: now + win }); if (__RL.size > 4000) __RL.clear(); return true; }
    b.n++;
    if (b.n > max) { res.setHeader('Retry-After', String(Math.ceil((b.r - now) / 1000))); res.status(429).json({ error: 'rate_limited', message: 'تم تجاوز الحد المسموح — أعد المحاولة بعد قليل' }); return false; }
    return true;
  } catch { return true; }
}
const __origin = (req) => {
  const o = req.headers.origin || '';
  if (!o) return '*';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return o;
  if (/^https?:\/\/[a-z0-9-]+\.(vercel|arcada)\.app$/.test(o)) return o;
  try { if (o === 'https://' + req.headers.host) return o; } catch {}
  return 'null';
};

export default async function handler(req, res) {
  __ABUNAWAF_HARDENED__: if (!__rate(req, res)) return;
  res.setHeader('Access-Control-Allow-Origin', __origin(req)); res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path } = req.query;
  const params = { ...req.query };
  delete params.path;

  if (!path) return res.json({ code: -1, msg: 'Missing path parameter', data: null });

  try {
    // TikWM API - use POST with form data
    const formBody = new URLSearchParams(params).toString();
    
    const response = await fetch(`https://www.tikwm.com/api/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.tikwm.com',
        'Referer': 'https://www.tikwm.com/'
      },
      body: formBody,
      signal: AbortSignal.timeout(15000)
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch {
        return res.json({ code: -1, msg: 'Invalid JSON response', data: null });
      }
    }

    // If not JSON, try alternative TikTok APIs
    // RapidAPI alternatives
    const alternatives = [
      {
        url: `https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${params.unique_id || ''}`,
        headers: {
          'X-RapidAPI-Key': 'free', // Free tier
          'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
        }
      }
    ];

    for (const alt of alternatives) {
      try {
        const r = await fetch(alt.url, {
          headers: alt.headers,
          signal: AbortSignal.timeout(8000)
        });
        if (r.ok) {
          const data = await r.json();
          return res.json({ code: 0, msg: 'success', data });
        }
      } catch {}
    }

    return res.json({ 
      code: -1, 
      msg: 'TikTok API temporarily unavailable. Try again later.', 
      data: null,
      debug: { contentType, textLength: text.length }
    });

  } catch (e) {
    return res.json({ code: -1, msg: e.message, data: null });
  }
}
