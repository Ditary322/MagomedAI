const { executeCommand } = require('./executor');

/**
 * Инициализация AI-команд.
 * Вызывать из `core/init.py` или `main.js`
 */
function initAI(bot) {
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;

    if (message.startsWith('!')) {
      await executeCommand(bot, message);
    }
  });

  bot.chat('🧠 Магомед подключён. Жду команд.');
}

module.exports = { initAI };
