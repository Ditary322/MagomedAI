const { log }             = require('../../utils/logger');
const { getInventoryCounts } = require('../world/inventory');
const mc                  = require('../utils/mcdata');
const { handleItem }      = require('../utils/itemHelper');


async function equip(bot, itemName) {
  // 1) Достаём 1 штуку через itemHelper
  const ok = await handleItem(bot, itemName, 1);
  if (!ok) {
    log(bot, `Не удалось получить ${itemName}, чтобы надеть.`);
    return false;
  }

  // 2) Предмет точно есть — ищем его в инвентаре
  const item = bot.inventory.items().find(i => i.name === itemName);
  if (!item) {
    log(bot, `Предмет ${itemName} не найден в инвентаре после handleItem.`);
    return false;
  }

  // 3) Экипируем в нужный слот
  if (itemName.includes('leggings')) {
    await bot.equip(item, 'legs');
  } else if (itemName.includes('boots')) {
    await bot.equip(item, 'feet');
  } else if (itemName.includes('helmet')) {
    await bot.equip(item, 'head');
  } else if (itemName.includes('chestplate') || itemName.includes('elytra')) {
    await bot.equip(item, 'torso');
  } else if (itemName.includes('shield')) {
    await bot.equip(item, 'off-hand');
  } else {
    await bot.equip(item, 'hand');
  }

  log(bot, `Надел ${itemName}.`);
  return true;
}


async function equipBestFood(bot) {
  // Попробуем достать немного еды перед выбором лучшей
  // (можно указать любое максимальное количество, например 5)
  await handleItem(bot, 'cooked_beef', 5);

  const foods = bot.inventory.items().filter(item => mc.isFood(item.name));
  if (foods.length === 0) return false;

}


async function logInventory(bot) {
  const counts = getInventoryCounts(bot);
  if (!counts || Object.keys(counts).length === 0) {
    bot.chat("Инвентарь пуст.");
    return;
  }

  const message = Object.entries(counts)
    .map(([item, count]) => `${item} x${count}`)
    .join(', ');

  bot.chat(`🎒 У меня есть: ${message}`);
}

async function equipHighestAttack(bot) {
  let weapons = bot.inventory.items().filter(
    item => mc.isTool(item.name)
  );  

  if (weapons.length === 0) {
    weapons = bot.inventory.items().filter(
      item => item.name.includes('pickaxe') || item.name.includes('shovel')
    );
  }

  if (weapons.length === 0) return false;

  // TODO: заменить sort на правильную по урону, если есть данные
  weapons.sort((a, b) => b.attackDamage - a.attackDamage); // предполагаем, что есть такое поле

  const weapon = weapons[0];
  if (weapon) {
    await bot.equip(weapon, 'hand');
    log(bot, `Вооружился ${weapon.name}`);
    return true;
  }

  return false;
}

module.exports = {
  equip,
  equipHighestAttack,
  equipBestFood,
  logInventory
};

