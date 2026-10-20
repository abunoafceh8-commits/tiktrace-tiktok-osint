export default async function handler(req, res) {
  const { path, ...params } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path parameter' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // First, get a session from TikWM
    const sessionHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'https://www.tikwm.com',
      'Referer': 'https://www.tikwm.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };

    // Try POST with form-urlencoded
    const formBody = new URLSearchParams(params).toString();
    const response = await fetch(`https://www.tikwm.com/api/${path}`, {
      method: 'POST',
      headers: { ...sessionHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
      signal: AbortSignal.timeout(15000)
    });
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      // If not JSON, try GET request
      const url = new URL(`https://www.tikwm.com/api/${path}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const r2 = await fetch(url.toString(), {
        headers: sessionHeaders,
        signal: AbortSignal.timeout(10000)
      });
      const data2 = await r2.json();
      return res.json(data2);
    }
  } catch (error) {
    // Return helpful error
    return res.json({ code: -1, msg: `TikWM API: ${error.message}. Try again in a moment.`, data: null });
  }
}
