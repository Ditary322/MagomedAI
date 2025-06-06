const { defend, hunt } = require('../combat');
const pf = require('mineflayer-pathfinder');

function match(goal) {
  const a = goal.action || goal?.plan?.[0]?.action;
  return ['attack', 'defend', 'retreat', 'hunt', 'use_bow', 'equip_armor', 'heal'].includes(a);
}

async function execute(bot, goal) {
  const step = goal.plan?.[0] || goal;
  const action = step.action;

  if (step.message) bot.chat(step.message);

  if (action === 'defend' || action === 'attack') {
    return await defend(bot);
  }

  if (action === 'hunt') {
    const { target = 'any' } = step;
    return await hunt(bot, target);
  }

  if (action === 'retreat') {
    const { GoalNear } = pf.goals;
    const pos = bot.entity.position.offset(10, 0, 10);
    bot.pathfinder.setGoal(new GoalNear(pos.x, pos.y, pos.z, 2));
    return true;
  }

  if (action === 'equip_armor') {
    const armorSlots = ['head', 'torso', 'legs', 'feet'];
    for (const slot of armorSlots) {
      const item = bot.inventory.items().find(i =>
        i.name.includes('_helmet') || i.name.includes('_chestplate') ||
        i.name.includes('_leggings') || i.name.includes('_boots')
      );
      if (item) {
        try {
          await bot.equip(item, slot);
        } catch (_) {}
      }
    }
    return true;
  }

  if (action === 'heal') {
    const food = bot.inventory.items().find(i => i.name.includes('cooked') || i.name === 'bread' || i.name.includes('apple'));
    if (food) {
      try {
        await bot.equip(food, 'hand');
        await bot.consume();
        return true;
      } catch (_) {
        return false;
      }
    }
    return false;
  }

  bot.chat(`❌ Неизвестное боевое действие: ${action}`);
  return false;
}

module.exports = { match, execute };
