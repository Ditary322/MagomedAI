// logger.js
function log(bot, msg) {
    bot.chat(`📢 ${msg}`);
    console.log(`[MagomedAI] ${msg}`);
  }
  
  module.exports = { log }; // ← именованный экспорт
  