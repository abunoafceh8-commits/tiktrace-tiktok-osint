export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
