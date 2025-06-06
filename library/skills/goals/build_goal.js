const { placeBlock, buildBox, buildStructure } = require('../building');

function match(goal) {
  const action = goal.action || goal?.plan?.[0]?.action;
  return ['place', 'build', 'buildbox', 'build_schematic'].includes(action);
}

async function execute(bot, goal) {
  const step = goal.plan?.[0] || goal;
  const action = step.action;

  if (step.message) bot.chat(step.message);

  if (action === 'place') {
    const { item, x, y, z } = step;
    if (!item || x == null || y == null || z == null) {
      bot.chat('❌ Не хватает данных для установки блока');
      return false;
    }
    return await placeBlock(bot, item, x, y, z);
  }

  if (action === 'buildbox' || action === 'build') {
    const { x, y, z, width = 5, height = 3, depth = 5, material = 'oak_planks' } = step;
    if (x == null || y == null || z == null) {
      bot.chat('❌ Не указаны координаты для постройки');
      return false;
    }
    return await buildBox(bot, x, y, z, width, height, depth, material);
  }

  if (action === 'build_schematic') {
    const { structure, pos } = step;
    if (!structure || !pos || pos.length !== 3) {
      bot.chat('❌ Нужна схема и позиция');
      return false;
    }
    return await buildStructure(bot, structure, { x: pos[0], y: pos[1], z: pos[2] });
  }

  bot.chat(`❌ Неизвестное действие в постройке: ${action}`);
  return false;
}

module.exports = { match, execute };
