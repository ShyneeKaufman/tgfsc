// Vercel Serverless Function: Telegram Webhook Handler

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', message: 'TG-Fisch Bot is active' });
  }

  const token = process.env.BOT_TOKEN || '8974555890:AAHM4U1BctSOwQAbbB_DALOHmdcLWQVHU1M';
  const webAppUrl = process.env.WEBAPP_URL || 'https://tgfsc.vercel.app/?v=3.5';

  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const text = (message.text || '').trim();
    const user = message.from || {};

    const telegramApi = `https://api.telegram.org/bot${token}`;

    if (text.startsWith('/start') || text.startsWith('/play')) {
      const baseUrl = process.env.WEBAPP_URL || 'https://tgfsc.vercel.app';
      const dynamicUrl = `${baseUrl.split('?')[0]}?v=5.0&t=${Date.now()}`;

      const welcomeText = `🎣 Welcome to TG-Fisch!\n\n` +
        `Cast your rod, watch the bobber, and keep your control bar centered on the fish until it's reeled in.\n\n` +
        `Features:\n` +
        `• 37 authentic fish species & 8 rare mutations (from Golden to Cosmic)\n` +
        `• 5 archipelago islands from Moosewood to The Depths (Vertigo)\n` +
        `• 11 Fisch fishing rods, baits, and infinite backpack\n` +
        `• Real-time multiplayer catch feed & global weather anomalies\n\n` +
        `Tap the button below to start fishing:`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🎣 Play TG-Fisch',
              web_app: { url: dynamicUrl }
            }
          ]
        ]
      };

      await fetch(`${telegramApi}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeText,
          reply_markup: keyboard
        })
      });
    } else if (text.startsWith('/help')) {
      const helpText = `How to Play TG-Fisch:\n\n` +
        `1. Tap "Play TG-Fisch".\n` +
        `2. Hold and release "Cast" into the water and wait for a bite.\n` +
        `3. When "BITE! HOOK NOW!" appears, tap quickly and track the fish with your control bar.\n` +
        `4. Sell catches from your backpack and purchase better rods and baits in the shop.`;

      await fetch(`${telegramApi}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: helpText
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
