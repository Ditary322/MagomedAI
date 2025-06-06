// models/MineCraft/library/skills/smelting.js

const { log } = require('../../utils/logger');
const world   = require('../../world/structure_manager');
const { placeBlock } = require('./building');
// Было require('../../utils/navigation') — неверный путь
const { goToNearestBlock } = require('../utils/navigation');
const mc      = require('../utils/mcdata');
const { handleItem } = require('../utils/itemHelper');

/**
 * Переплавляет указанный сырьевой предмет `itemName` в количестве `num`.
 */
async function smeltItem(bot, itemName, num = 1) {
  // 1) Проверяем, что ресурс можно переплавить
  if (!mc.isSmeltable(itemName)) {
    log(bot, `❌ ${itemName} нельзя переплавить.`);
    return false;
  }

  // 2) Достаём сырьё
  const okRaw = await handleItem(bot, itemName, num);
  if (!okRaw) {
    log(bot, `❌ Не удалось получить ${num}×${itemName} для переплавки.`);
    return false;
  }

  // 3) Достаём топливо (уголь)
  const okFuel = await handleItem(bot, 'coal', 1);
  if (!okFuel) {
    log(bot, `❌ Не удалось получить уголь для печи.`);
    return false;
  }

  // 4) Ищем печь
  let furnace = world.getNearestBlock(bot, 'furnace', 32);
  if (!furnace) {
    log(bot, '🏗️ Печь не найдена, ставлю рядом');
    const pos = bot.entity.position.floored().offset(2, 0, 0);
    await placeBlock(bot, 'furnace', pos.x, pos.y, pos.z);
    furnace = world.getNearestBlock(bot, 'furnace', 32);
    if (!furnace) {
      log(bot, '❌ Не удалось установить печь');
      return false;
    }
  }

  // 5) Подходим к печи
  await goToNearestBlock(bot, 'furnace', 4);
  await bot.lookAt(furnace.position);

  log(bot, `🔥 Переплавляю ${num}×${itemName}…`);
  const f = await bot.openFurnace(furnace);

  // 6) Загрузка сырья и топлива
  try {
    await f.putInput(mc.getItemId(itemName), null, num);
    await f.putFuel(mc.getItemId('coal'), null, 1);
  } catch (err) {
    log(bot, `❌ Ошибка загрузки в печь: ${err.message}`);
    f.close();
    return false;
  }

  // 7) Ждём, пока сырьё исчезнет из инпута
  await new Promise(resolve => {
    const interval = setInterval(() => {
      const input = f.inputItem();
      if (!input || input.count === 0) {
        clearInterval(interval);
        f.close();
        log(bot, `✅ ${itemName} переплавлен.`);
        resolve();
      }
    }, 1000);
  });

  return true;
}

/**
 * Переплавляет всё, что есть в инвентаре (количество считаем напрямую).
 */
async function cookAll(bot, itemName) {
  // Считаем, сколько сырья в инвентаре
  const count = bot.inventory.items()
    .filter(i => i.name === itemName)
    .reduce((sum, i) => sum + i.count, 0);
  if (count === 0) {
    bot.chat(`❌ У меня нет ${itemName} для готовки.`);
    return false;
  }

  bot.chat(`🔥 Готовлю ${count}×${itemName}…`);
  return await smeltItem(bot, itemName, count);
}

module.exports = {
  smeltItem,
  cookAll
};
