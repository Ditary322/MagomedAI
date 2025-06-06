const fs   = require('fs');
const path = require('path');
const { log } = require('../../utils/logger');
const world = require('../../world/structure_manager');
const { handleItem } = require('../utils/itemHelper');
const { injectPathfinder } = require('../utils/navigation');
const mc = require('../utils/mcdata');

/**
 * Крафтит itemName в количестве quantity.
 * Автоматически добывает/крафтит компоненты.
 */
async function craftRecipe(bot, itemName, quantity = 1) {
  // 1) Ищем ID предмета и доступные рецепты
  const id = mc.getItemId(itemName);
  if (id == null) {
    log(bot, `❌ Неизвестный предмет для крафта: ${itemName}`);
    return false;
  }
  let recipes;
  try {
    recipes = bot.recipesFor(id, null, quantity, null) || [];
  } catch {
    recipes = [];
  }
  if (recipes.length === 0) {
    log(bot, `🔍 Рецепт для ${itemName}×${quantity} не найден`);
    return false;
  }
  // Берём первый рецепт
  const recipe = recipes[0];

  log(bot, `🔨 Скрафти́ваю ${quantity}×${itemName} по первому доступному рецепту`);

  // 2) Достаём все компоненты рецепта
  for (const comp of recipe.ingredients) {
    const compName = mc.itemsByName[comp.id]?.name;
    if (!compName) continue;
    const needed = comp.count * quantity;
    log(bot, `  → Подготавливаю ${needed}×${compName}`);
    const ok = await handleItem(bot, compName, needed);
    if (!ok) {
      log(bot, `❌ Не удалось получить компонент ${compName}`);
      return false;
    }
  }

  // 3) Ищем или ставим верстак (crafting_table)
  let tableBlock = world.getNearestBlock(bot, 'crafting_table', 32);
  if (!tableBlock) {
    log(bot, '🏗️ Верстак не найден, ставлю рядом');
    const pos = bot.entity.position.floored().offset(2, 0, 0);
    await placeCraftingTable(bot, pos.x, pos.y, pos.z);
    tableBlock = world.getNearestBlock(bot, 'crafting_table', 32);
    if (!tableBlock) {
      log(bot, '❌ Не удалось поставить верстак');
      return false;
    }
  }

  // 4) Подходим к верстаку и открываем его
  injectPathfinder(bot);
  await bot.pathfinder.goto(new pf.goals.GoalBlock(
    tableBlock.position.x,
    tableBlock.position.y,
    tableBlock.position.z
  ));
  const craftingTable = await bot.openWorkbench(tableBlock);

  // 5) Делаем крафт
  try {
    await craftingTable.craft(recipe, quantity, 0);
    log(bot, `✅ Скрафти́л ${quantity}×${itemName}`);
    craftingTable.close();
    return true;
  } catch (err) {
    log(bot, `❌ Ошибка крафта ${itemName}: ${err.message}`);
    craftingTable.close();
    return false;
  }
}

/**
 * Ставит верстак в точке (x,y,z)
 */
async function placeCraftingTable(bot, x, y, z) {
  const { placeBlock } = require('./building');
  return await placeBlock(bot, 'crafting_table', x, y, z);
}

module.exports = { craftRecipe };
