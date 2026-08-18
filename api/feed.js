// In-memory buffer of recent real player catches on Vercel Serverless
let recentCatches = [];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        playerId,
        playerName,
        fishName,
        rarity,
        mutation,
        mutationId,
        weight,
        price,
        biomeName,
        isPerfect
      } = body || {};

      if (!fishName || !weight) {
        return res.status(400).json({ error: 'Missing catch parameters' });
      }

      const cleanPlayerName = (playerName || 'Рыбак').slice(0, 32);
      const newCatch = {
        id: `catch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        playerId: playerId || 'anon',
        playerName: cleanPlayerName,
        fishName,
        rarity: rarity || 'common',
        mutation: mutation || 'Обычная',
        mutationId: mutationId || 'normal',
        weight: Number(weight),
        price: Number(price) || 0,
        biomeName: biomeName || 'Лазурная Бухта',
        isPerfect: Boolean(isPerfect),
        timestamp: Date.now()
      };

      // Add to beginning and retain last 50 catches
      recentCatches.unshift(newCatch);
      if (recentCatches.length > 50) {
        recentCatches = recentCatches.slice(0, 50);
      }

      return res.status(200).json({ success: true, catch: newCatch });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    const since = parseInt(req.query.since || '0', 10);
    const now = Date.now();

    // Clean up older than 1 hour
    recentCatches = recentCatches.filter(c => (now - c.timestamp) < 3600000);

    const filtered = since > 0 
      ? recentCatches.filter(c => c.timestamp > since)
      : recentCatches.slice(0, 10);

    return res.status(200).json({
      catches: filtered,
      serverTime: now
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
