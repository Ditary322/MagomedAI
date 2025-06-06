// models/MineCraft/library/utils/navigation.js

const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalBlock } = goals;

/**
 * Простая in-memory карта для запоминания точек
 * ключ — произвольная строка, значение — Vec3
 */
const rememberedPlaces = new Map();

/**
 * Подключает плагин pathfinder и настраивает Movements один раз
 * @param {import('mineflayer').Bot} bot
 */
function injectPathfinder(bot) {
  if (!bot.pathfinder) {
    bot.loadPlugin(pathfinder);
    const mcData = require('minecraft-data')(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
  }
}

/**
 * Запоминает текущее положение бота под именем name
 * @param {import('mineflayer').Bot} bot
 * @param {string} name
 */
async function remember(bot, name) {
  const pos = bot.entity.position.floored();
  rememberedPlaces.set(name, pos);
  bot.chat(`📌 Запомнил место "${name}" (${pos.x},${pos.y},${pos.z})`);
  return true;
}

/**
 * Идёт к ранее запомненной точке name
 * @param {import('mineflayer').Bot} bot
 * @param {string} name
 */
async function goto(bot, name) {
  injectPathfinder(bot);
  const pos = rememberedPlaces.get(name);
  if (!pos) {
    bot.chat(`❌ Не знаю точку "${name}"`);
    return false;
  }
  bot.chat(`🚶 Иду к "${name}"…`);
  await bot.pathfinder.goto(new GoalBlock(pos.x, pos.y, pos.z));
  bot.chat(`✅ Прибыл в "${name}"`);
  return true;
}

/**
 * Исследует область в радиусе ±20 блоков (рандомная точка)
 * @param {import('mineflayer').Bot} bot
 * @param {string} [biome] — для логов, можно игнорировать
 */
async function explore(bot, biome = 'any') {
  injectPathfinder(bot);
  const start = bot.entity.position.floored();
  const dx = Math.floor(Math.random() * 41) - 20;
  const dz = Math.floor(Math.random() * 41) - 20;
  const target = start.offset(dx, 0, dz);
  bot.chat(`🧭 Исследую ${biome} к (${target.x},${target.y},${target.z})`);
  await bot.pathfinder.goto(new GoalBlock(target.x, target.y, target.z));
  bot.chat(`🔍 Закончил исследование`);
  return true;
}

module.exports = {
  injectPathfinder,
  remember,
  goto,
  explore
};
