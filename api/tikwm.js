export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path, ...params } = req.query;
  if (!path) return res.status(400).json({ code: -1, msg: 'Missing path', data: null });

  try {
    // Try TikWM API directly with POST
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
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      // Try GET as fallback
      const url = new URL(`https://www.tikwm.com/api/${path}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const r2 = await fetch(url.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      return res.json(await r2.json());
    }
  } catch (e) {
    return res.json({ code: -1, msg: `TikWM error: ${e.message}`, data: null });
  }
}
