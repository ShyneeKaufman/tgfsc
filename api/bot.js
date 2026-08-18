// Vercel Serverless Function: Telegram Webhook Handler

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', message: 'TG-Fisch Bot is active' });
  }

  const token = process.env.BOT_TOKEN || '8974555890:AAHM4U1BctSOwQAbbB_DALOHmdcLWQVHU1M';
  const webAppUrl = process.env.WEBAPP_URL || 'https://tgfsc.vercel.app/?v=3.0';

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
      const welcomeText = `Забрасывай удочку, следи за поплавком и удерживай бегунок на рыбе, пока шкала вываживания не заполнится.\n\n` +
        `Что тут есть:\n` +
        `• 35+ видов рыб и 8 мутаций (от золотых до космических)\n` +
        `• 4 биома: от прибрежной бухты до лавового кратера\n` +
        `• Удочки со статами натяжения, наживки и расширение садка\n` +
        `• Тактильная отдача на поклевках и рывках\n\n` +
        `Жми кнопку ниже, чтобы начать:`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🎣 Запустить рыбалку',
              web_app: { url: webAppUrl }
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
      const helpText = `Как тут всё устроено:\n\n` +
        `1. Нажимаешь «Запустить рыбалку».\n` +
        `2. Жмешь «Забросить» и ждешь сигнала поклевки.\n` +
        `3. При сигнале «ПОДСЕКАЙ» жмешь кнопку и удерживаешь бегунок на рыбе.\n` +
        `4. Продаешь рыбу в садке и берешь более прочные удочки в магазине.`;

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
