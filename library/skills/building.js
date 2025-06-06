// models/MineCraft/library/skills/building.js

const pf = require('mineflayer-pathfinder');
const { Movements, goals } = pf;
const { GoalBlock } = goals;
const { findValidPosition } = require('../world/space');
const { log } = require('../../utils/logger');
const { handleItem } = require('../utils/itemHelper');
const { injectPathfinder } = require('../utils/navigation');

/**
 * Находит подходящее место для строительства и ведёт бота туда.
 * @param {import('mineflayer').Bot} bot
 * @param {number} width
 * @param {number} depth
 */
async function prepareBuild(bot, width = 5, depth = 5) {
  const area = findValidPosition(bot, width, depth);
  if (!area) {
    bot.chat("❌ Не вижу подходящей зоны для строительства.");
    return false;
  }
  const centerX = Math.floor((area.xMin + area.xMax) / 2);
  const centerZ = Math.floor((area.zMin + area.zMax) / 2);
  const y = Math.floor(bot.entity.position.y);

  // Настраиваем pathfinder и идём в центр зоны
  injectPathfinder(bot);
  await bot.pathfinder.goto(new GoalBlock(centerX, y, centerZ));

  log(bot, `✅ Зона для строительства: (${centerX}, ${y}, ${centerZ})`);
  return true;
}

/**
 * Ставит один блок blockName в точке (x,y,z).
 * @param {import('mineflayer').Bot} bot
 * @param {string} blockName
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
async function placeBlock(bot, blockName, x, y, z) {
  const below = bot.blockAt(bot.vec3(x, y - 1, z));
  if (!below) {
    log(bot, `❌ Нет опоры для ${blockName} на (${x},${y},${z}).`);
    return false;
  }

  // Убедимся, что у нас есть блок и экипируем его
  const ok = await handleItem(bot, blockName, 1);
  if (!ok) {
    bot.chat(`❌ Не удалось получить блок ${blockName}`);
    return false;
  }
  const slot = bot.inventory.items().find(i => i.name === blockName);
  await bot.equip(slot, 'hand');

  // Подходим к месту установки
  injectPathfinder(bot);
  await bot.pathfinder.goto(new GoalBlock(below.position.x, below.position.y, below.position.z));

  try {
    await bot.placeBlock(below, bot.vec3(0, 1, 0));
    log(bot, `✅ Поставил ${blockName} на (${x},${y},${z})`);
    return true;
  } catch (err) {
    log(bot, `❌ Ошибка установки ${blockName}: ${err.message}`);
    return false;
  }
}

/**
 * Строит коробку (пол и стены) из material.
 * Точка (x,y,z) — один из углов пола.
 * Размеры width×height×depth.
 */
async function buildBox(bot, x, y, z, width = 5, height = 3, depth = 5, material = 'oak_planks') {
  // Считаем, сколько всего блоков нужно
  const needed = width * depth    // пол
               + 2 * (width + depth) * (height - 1); // стены без углов
  // Достаём все материалы сразу
  const ok = await handleItem(bot, material, needed);
  if (!ok) {
    bot.chat(`❌ Не удалось получить ${needed}×${material}`);
    return false;
  }

  log(bot, `🏗️ Строю коробку ${width}×${height}×${depth} из ${material}`);

  // Убедимся, что стоим в начале зоны
  // (можно использовать prepareBuild для поиска свободного места)
  // await prepareBuild(bot, width, depth);

  // Настраиваем pathfinder единожды
  injectPathfinder(bot);

  // Пол
  for (let dx = 0; dx < width; dx++) {
    for (let dz = 0; dz < depth; dz++) {
      await placeBlock(bot, material, x + dx, y,     z + dz);
    }
  }
  // Стены по периметру
  for (let dy = 1; dy < height; dy++) {
    // по X-стенам
    for (let dx = 0; dx < width; dx++) {
      await placeBlock(bot, material, x + dx, y + dy, z);
      await placeBlock(bot, material, x + dx, y + dy, z + depth - 1);
    }
    // по Z-стенам
    for (let dz = 0; dz < depth; dz++) {
      await placeBlock(bot, material, x,             y + dy, z + dz);
      await placeBlock(bot, material, x + width - 1, y + dy, z + dz);
    }
  }

  bot.chat(`✅ Построена коробка ${width}×${height}×${depth} из ${material}`);
  log(bot, `Коробка построена из ${material}`);
  return true;
}

module.exports = {
  prepareBuild,
  placeBlock,
  buildBox
};
