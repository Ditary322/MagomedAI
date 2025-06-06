const { findItem } = require('../../utils/itemHelper');
const { craftRecipe } = require('../crafting');
const { collectItem } = require('../mining');
const { checkInventory } = require('../inventory');

function match(goal) {
  const a = goal.action || goal?.plan?.[0]?.action;
  return a === 'craft' || a === 'collect';
}

async function execute(bot, goal) {
  const action = goal.action || goal?.plan?.[0]?.action;
  const item = goal.item || goal?.plan?.[0]?.item;
  const count = goal.count || goal?.plan?.[0]?.count || 1;

  if (goal.message) bot.chat(goal.message);

  if (!item || !action) {
    bot.chat("❌ Цель без item или action");
    return false;
  }

  const itemMeta = findItem(item);
  if (!itemMeta) {
    bot.chat(`❌ Неизвестный предмет: ${item}`);
    return false;
  }

  const has = await checkInventory(bot, item, count);
  if (has) {
    bot.chat(`✅ ${item} уже есть`);
    return true;
  }

  if (action === 'craft') {
    return await craftRecipe(bot, item, count);
  }

  if (action === 'collect') {
    return await collectItem(bot, item, count);
  }

  bot.chat(`❌ Неизвестное действие: ${action}`);
  return false;
}

module.exports = { match, execute };
