// models/MineCraft/library/skills/utils/prerequisites.js

const { collectItem } = require('../mining');
const { craftRecipe } = require('../crafting');
const { placeBlock }  = require('../building');

// Краткая таблица рецептов, необходимых для инструментов и верстака
const RECIPES = {
  // itemName: { ingredientName: quantity, ... }
  sticks:            { planks: 2 },
  crafting_table:    { planks: 4 },
  wooden_pickaxe:    { planks: 3, sticks: 2 },
  stone_pickaxe:     { cobblestone: 3, sticks: 2 },
  iron_pickaxe:      { iron_ingot:    3, sticks: 2 },
  // добавьте сюда другие инструменты/предметы по необходимости
};

/**
 * Обеспечивает в инвентаре `itemName` в количестве `count`
 * — либо собирает из мира (для сырья), либо крафтит по рецепту,
 * рекурсивно обеспечивая ингредиенты.
 */
async function ensureItem(bot, itemName, count = 1) {
  // 1) Если это сырьё (нет рецепта) — просто собираем
  if (!RECIPES[itemName]) {
    return collectItem(bot, itemName, count);
  }

  // 2) Это крафтовый предмет — сперва обеспечиваем ингредиенты
  const recipe = RECIPES[itemName];
  for (const [ing, qty] of Object.entries(recipe)) {
    // умножаем на нужное количество итоговых предметов
    const needed = qty * count;
    await ensureItem(bot, ing, needed);
  }

  // 3) Если это верстак или инструмент, возможно нужно поставить верстак
  if (itemName !== 'sticks' && itemName !== 'planks') {
    // Проверяем: нам нужен верстак в мире?
    // Здесь грубо: если крафтим не sticks и не planks, 
    // то требуется верстак для большинства рецептов
    await placeBlock(bot, 'crafting_table',
      Math.floor(bot.entity.position.x),
      Math.floor(bot.entity.position.y),
      Math.floor(bot.entity.position.z) - 1
    );
  }

  // 4) Наконец, скрафтим сам предмет
  return craftRecipe(bot, itemName, count);
}

module.exports = { ensureItem };
