const { goToLocation, explore, followPath, teleportTo } = require('../navigation');

function match(goal) {
  const action = goal.action || goal?.plan?.[0]?.action;
  return ['go_to', 'explore', 'follow_path', 'teleport', 'spawn'].includes(action);
}

async function execute(bot, goal) {
  const step = goal.plan?.[0] || goal;
  const action = step.action;

  if (step.message) bot.chat(step.message);

  if (action === 'go_to') {
    const { x, y, z } = step;
    if (x == null || y == null || z == null) {
      bot.chat('❌ Координаты не указаны');
      return false;
    }
    return await goToLocation(bot, x, y, z);
  }

  if (action === 'explore') {
    const { biome = "any" } = step;
    return await explore(bot, biome);
  }

  if (action === 'follow_path') {
    const { path } = step;
    if (!Array.isArray(path) || path.length === 0) {
      bot.chat('❌ Путь не указан');
      return false;
    }
    return await followPath(bot, path);
  }

  if (action === 'teleport') {
    const { x, y, z } = step;
    if (x == null || y == null || z == null) {
      bot.chat('❌ Нужны координаты для телепортации');
      return false;
    }
    return await teleportTo(bot, x, y, z);
  }

  if (action === 'spawn') {
    bot.chat('⚙️ Команда spawn пока не реализована');
    return false;
  }

  bot.chat(`❌ Неизвестное навигационное действие: ${action}`);
  return false;
}

module.exports = { match, execute };
