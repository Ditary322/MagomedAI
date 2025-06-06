const { cookAll } = require('../smelting');
const { checkInventory } = require('../inventory');
const { findItem } = require('../../utils/itemHelper');

function match(goal) {
  const action = goal.action || goal?.plan?.[0]?.action;
  return action === 'smelt' || action === 'cook';
}

async function execute(bot, goal) {
  const step = goal.plan?.[0] || goal;
  const item = step.item;
  const count = step.count || 1;

  if (step.message) bot.chat(step.message);

  if (!item) {
    bot.chat("❌ Не указан item для переплавки");
    return false;
  }

  const itemMeta = findItem(item);
  if (!itemMeta) {
    bot.chat(`❌ Неизвестный предмет: ${item}`);
    return false;
  }

  const already = await checkInventory(bot, item, count);
  if (already) {
    bot.chat(`✅ Уже есть ${item}`);
    return true;
  }

  return await cookAll(bot, item);
}

module.exports = { match, execute };
