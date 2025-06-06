const { log } = require('../../utils/logger');
const world = require('../world');
const { equipItemByName } = require('./inventory');
const { goToPosition } = require('./navigation');
const mc = require('../utils/mcdata');
const { handleItem } = require('../utils/itemHelper');


async function equipHighestAttack(bot) {
  const swords = ['netherite_sword', 'diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword'];
  for (const sword of swords) {
    // сначала достаём или создаём меч (через itemHelper)
    const ok = await handleItem(bot, sword, 1);
    if (ok && await equipItemByName(bot, sword)) {
      return true;
    }
  }
  return false;
}


async function attackEntity(bot, entity, kill = true) {
  const pos = entity.position;
  await equipHighestAttack(bot);

  if (!kill) {
    if (bot.entity.position.distanceTo(pos) > 5) {
      log(bot, 'Иду к мобу...');
      await goToPosition(bot, pos.x, pos.y, pos.z);
    }
    log(bot, 'Атакую...');
    await bot.attack(entity);
  } else {
    bot.pvp.attack(entity);
    while (world.getNearbyEntities(bot, 24).includes(entity)) {
      await bot.waitForTicks(20);
      if (bot.interrupt_code) break;
    }
  }

  return true;
}

async function attackNearest(bot, mobType, kill = true) {
  bot.modes.pause?.('cowardice');

  if (!mc.isHuntable({ name: mobType }) && mc.isHostile({ name: mobType })) {
    bot.chat(`Будь готов, ${mobType} может дать сдачи.`);
  }
  

  const mob = world.getNearbyEntities(bot, 24).find(e => e.name === mobType);
  if (mob) {
    return await attackEntity(bot, mob, kill);
  }

  log(bot, `Не нашёл ${mobType} рядом.`);
  return false;
}

async function consume(bot, itemName) {
  // вместо ручного поиска:
  // const item = bot.inventory.items().find(i => i.name === itemName);
  // if (!item) { … }

  // используем itemHelper
  const ok = await handleItem(bot, itemName, 1);
  if (!ok) {
    log(bot, `Не удалось получить ${itemName}`);
    return false;
  }
  const item = bot.inventory.items().find(i => i.name === itemName);

  try {
    await bot.equip(item, 'hand');
    await bot.consume();
    log(bot, `Съел ${itemName}`);
    return true;
  } catch (err) {
    log(bot, `Не смог съесть ${itemName}: ${err.message}`);
    return false;
  }
}

async function consume(bot, itemName) {
  // вместо ручного поиска:
  // const item = bot.inventory.items().find(i => i.name === itemName);
  // if (!item) { … }

  // используем itemHelper
  const ok = await handleItem(bot, itemName, 1);
  if (!ok) {
    log(bot, `Не удалось получить ${itemName}`);
    return false;
  }
  const item = bot.inventory.items().find(i => i.name === itemName);

  try {
    await bot.equip(item, 'hand');
    await bot.consume();
    log(bot, `Съел ${itemName}`);
    return true;
  } catch (err) {
    log(bot, `Не смог съесть ${itemName}: ${err.message}`);
    return false;
  }
}

async function defend(bot, target = "self") {
  const nearbyHostile = world.getNearbyEntities(bot, 16).find(e => mc.isHostile(e));

  if (!nearbyHostile) {
    bot.chat("🕊 Врагов рядом нет");
    return false;
  }

  bot.chat(`🛡 Защищаю от ${nearbyHostile.name}`);
  return await attackEntity(bot, nearbyHostile, true);
}

module.exports = {
  attackNearest,
  attackEntity,
  consume,
  equipHighestAttack,
  defend
};
