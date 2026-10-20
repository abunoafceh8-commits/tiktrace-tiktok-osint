export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path, ...params } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path' });

  try {
    const r = await fetch(`https://tiktrace-osint-vgjc.arcada.app/api/tikwm?path=${encodeURIComponent(path)}&${new URLSearchParams(params).toString()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000)
    });
    const data = await r.json();
    return res.json(data);
  } catch (e) {
    return res.json({ code: -1, msg: e.message, data: null });
  }
}
