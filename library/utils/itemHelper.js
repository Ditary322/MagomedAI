const fs   = require('fs');
const path = require('path');
const { log } = require('../../utils/logger');

// Подгружаем датасет предметов
const itemsData = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../data/minecraft/items.json'),
    'utf-8'
  )
);

/**
 * Находит в датасете предмет по его имени или id.
 */
function findItem(key) {
  if (typeof key === 'number') {
    return itemsData.find(it => it.id === key) || null;
  }
  const lower = key.toLowerCase();
  return itemsData.find(
    it =>
      it.name.toLowerCase() === lower ||
      (it.displayName && it.displayName.toLowerCase() === lower)
  ) || null;
}

/**
 * Универсальная обработка предмета:
 * 1) Проверяем, сколько уже в инвентаре
 * 2) Если есть рецепт — динамически require('crafting') и крафтим
 * 3) Иначе — динамически require('mining') и добываем
 */
async function handleItem(bot, itemKey, quantity = 1) {
  const item = findItem(itemKey);
  if (!item) {
    log(bot, `❌ Предмет "${itemKey}" не найден в датасете.`);
    return false;
  }
  const { id, name } = item;

  // Считаем, сколько уже в инвентаре
  const invCount = bot.inventory.slots
    .filter(slot => slot && slot.type === id)
    .reduce((sum, slot) => sum + slot.count, 0);

  if (invCount >= quantity) {
    log(bot, `✅ В инвентаре уже есть ${invCount}×${name}.`);
    return true;
  }

  // Пробуем получить рецепт (может упасть)
  let recipes = [];
  try {
    recipes = bot.recipesFor(id, null, quantity, null) || [];
  } catch (err) {
    // Ignore
  }

  if (recipes.length > 0) {
    log(bot, `🔨 Пытаюсь скрафтить ${quantity}×${name}…`);
    // Динамически подгружаем функцию craftRecipe
    const { craftRecipe } = require('../skills/crafting');
    return await craftRecipe(bot, itemKey, quantity);
  }

  // Иначе добываем
  log(bot, `⛏️ Добываю ${quantity}×${name}…`);
  // Динамически подгружаем функцию collectItem
  const { collectItem } = require('../skills/mining');
  return await collectItem(bot, itemKey, quantity);
}

module.exports = {
  findItem,
  handleItem
};
