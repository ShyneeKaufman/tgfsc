// Vercel Serverless Function: Telegram Webhook Handler
// Zero dependencies, ultra-fast cold start

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', message: 'TG-Fisch Bot Webhook is running' });
  }

  const token = process.env.BOT_TOKEN;
  const webAppUrl = process.env.WEBAPP_URL || 'https://tgfsc-2jbnlx5he-shyneekaufmans-projects.vercel.app';

  if (!token) {
    console.error('BOT_TOKEN is not configured in environment variables');
    return res.status(500).json({ error: 'BOT_TOKEN missing' });
  }

  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const text = message.text || '';
    const user = message.from || {};

    const telegramApi = `https://api.telegram.org/bot${token}`;

    if (text.startsWith('/start') || text.startsWith('/play')) {
      const welcomeText = `🌊 **Добро пожаловать в TG-Fisch, ${user.first_name || 'Рыбак'}!**\n\n` +
        `🎣 Тебя ждет настоящая океанская рыбалка со скилл-бейзд вываживанием, мутациями и редчайшими видами рыб!\n\n` +
        `🏆 **Твои возможности:**\n` +
        `• 35+ уникальных рыб от карася до Кракена\n` +
        `• 8 мутаций (Золотые, Абиссальные, Космические)\n` +
        `• Прокачка снастей и путешествия по 4 биомам\n` +
        `• Тактильная отдача и звуки прямо в Telegram\n\n` +
        `Нажимай кнопку ниже и забрасывай удочку! 👇`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🎣 Играть в TG-Fisch',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: '📖 Официальный канал',
              url: 'https://t.me/telegram'
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
          parse_mode: 'Markdown',
          reply_markup: keyboard
        })
      });
    } else if (text.startsWith('/help')) {
      const helpText = `❓ **Как играть в TG-Fisch:**\n\n` +
        `1. Нажми кнопку **"Играть"** для открытия Mini App.\n` +
        `2. Нажимай **"Забросить"** и жди поклевки.\n` +
        `3. При сигнале **"ПОДСЕКАЙ!"** удерживай ползунок на рыбе.\n` +
        `4. Продавай улов в садке и покупай мощные удочки в магазине!\n\n` +
        `Удачной рыбалки! 🐟`;

      await fetch(`${telegramApi}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: helpText,
          parse_mode: 'Markdown'
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
