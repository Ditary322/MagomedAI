const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalBlock } = goals;
const minecraftData = require('minecraft-data');

// Временное in-memory хранение точек
const rememberedPlaces = new Map();

/**
 * Подключает плагин pathfinder и настраивает Movements один раз
 */
function injectPathfinder(bot) {
  if (!bot.pathfinder) {
    bot.loadPlugin(pathfinder);
    const mcData = minecraftData(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
  }
}

/**
 * !remember("название") — запоминает текущее положение
 */
async function remember(bot, name, task = null) {
  const pos = bot.entity.position.floored();
  rememberedPlaces.set(name, pos);
  bot.chat(`📌 Запомнил место "${name}" в координатах (${pos.x}, ${pos.y}, ${pos.z})`);
  if (task) task.log(`Запомнено как ${name}`);
  return true;
}

/**
 * !goto("название") — идёт к месту, если оно сохранено
 */
async function goto(bot, name, task = null) {
  injectPathfinder(bot);
  const pos = rememberedPlaces.get(name);
  if (!pos) {
    bot.chat(`❌ Не знаю, где находится "${name}"`);
    if (task) task.log("Место не найдено");
    return false;
  }

  const goal = new GoalBlock(pos.x, pos.y, pos.z);
  bot.chat(`🚶 Иду к "${name}"...`);
  if (task) task.log(`Начинаю путь к ${name}`);

  await bot.pathfinder.goto(goal);

  bot.chat(`✅ Прибыл в "${name}"`);
  if (task) task.updateProgress(1.0);
  return true;
}

/**
 * !explore("биом") — идёт в рандомную точку в радиусе ±20 блоков
 */
async function explore(bot, biome = "any", task = null) {
  injectPathfinder(bot);

  const dx = Math.floor(Math.random() * 41) - 20;
  const dz = Math.floor(Math.random() * 41) - 20;
  const start = bot.entity.position.floored();
  const targetPos = start.offset(dx, 0, dz);

  const goal = new GoalBlock(targetPos.x, targetPos.y, targetPos.z);
  bot.chat(`🧭 Исследую ${biome} (координаты: ${targetPos.x}, ${targetPos.y}, ${targetPos.z})`);
  if (task) task.log(`Исследование: ${biome}`);

  await bot.pathfinder.goto(goal);

  bot.chat("🔍 Закончил исследование");
  if (task) task.updateProgress(1.0);
  return true;
}

module.exports = {
  remember,
  goto,
  explore
};
 