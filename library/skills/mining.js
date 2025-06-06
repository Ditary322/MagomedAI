// models/MineCraft/library/skills/mining.js

const pf = require('mineflayer-pathfinder');
const { Movements, goals } = pf;
const { GoalBlock } = goals;
const { log } = require('../../utils/logger');
const world = require('../../world/structure_manager');
const { getBlockVariants } = require('../utils/blockHelper');
const { handleItem } = require('../utils/itemHelper');

/**
 * Экипирует единожды инструмент под тип блока.
 * Если для типа не найден инструмент, возвращает null (ломаем рукой).
 * @param {Bot} bot 
 * @param {string} blockType 
 * @returns {Promise<string|null>}
 */
async function ensureTool(bot, blockType) {
  const t = blockType.toLowerCase();
  let candidates;

  // 1) Wood
  if (t.includes('wood') || t.includes('log') || t.includes('plank')) {
    candidates = ['wooden_axe'];
  }
  // 2) Dirt / Sand / Gravel
  else if (['dirt','grass','sand','gravel','clay'].some(x => t.includes(x))) {
    candidates = ['wooden_shovel'];
  }
  // 3) Stone variants
  else if (['cobblestone','stone','andesite','diorite','granite','deepslate'].some(x => t.includes(x))) {
    candidates = ['stone_pickaxe'];
  }
  // 4) Ore blocks
  else if (t.endsWith('_ore') || ['coal','iron','gold','diamond','emerald','lapis','redstone'].includes(t)) {
    candidates = ['iron_pickaxe','diamond_pickaxe','netherite_pickaxe'];
  }
  // 5) Fallback — деревянная кирка
  else {
    candidates = ['wooden_pickaxe'];
  }

  for (const name of candidates) {
    const ok = await handleItem(bot, name, 1);
    if (ok) {
      const slot = bot.inventory.items().find(i => i.name === name);
      if (slot) {
        await bot.equip(slot, 'hand');
        log(bot, `🛠️ Экипирован инструмент ${name}`);
        return name;
      }
    }
  }

  log(bot, `⚠️ Инструмент для ${blockType} не найден — ломаю рукой`);
  return null;
}

/**
 * Собирает num блоков типа blockType.
 * @param {Bot} bot 
 * @param {string} blockType 
 * @param {number} num 
 */
async function collectBlock(bot, blockType, num = 1) {
  if (num < 1) {
    log(bot, `Invalid number of blocks: ${num}`);
    return false;
  }

  // Подключаем pathfinder-плагин (делаем один раз)
  bot.loadPlugin(pf.pathfinder);
  const tool = await ensureTool(bot, blockType);

  // 2) Настраиваем pathfinder
  const mcData = require('minecraft-data')(bot.version);
  bot.pathfinder.setMovements(new Movements(bot, mcData));

  // 3) Цикл по добыче
  const variants = getBlockVariants(blockType);
  let collected = 0;

  for (let i = 0; i < num; i++) {
    const blocks = world.getNearestBlocks(bot, variants, 64);
    if (blocks.length === 0) {
      log(bot,
        collected === 0
          ? `Нет поблизости ${blockType} для добычи.`
          : `Добыто ${collected}/${num} ${blockType}, больше нет.`);
      break;
    }

    const block = blocks[0];
    log(bot, `⛏️ Иду к ${block.name} на (${block.position.x},${block.position.y},${block.position.z})`);
    await bot.pathfinder.goto(new GoalBlock(block.position.x, block.position.y, block.position.z));

    try {
      await bot.dig(block);
      collected++;
      await bot.waitForTicks(10);
    } catch (err) {
      log(bot, `❌ Ошибка при добыче ${block.name}: ${err.message}`);
      break;
    }
  }

  return collected > 0;
}

/**
 * Обёртка для команды !collect
 */
async function collectItem(bot, item, amount = 1) {
  bot.chat(`⌛ Добываю ${amount}×${item}…`);
  const ok = await collectBlock(bot, item, amount);
  bot.chat(ok
    ? `✅ Добыто ${amount}×${item}`
    : `❌ Не смог добыть ${item}`);
  return ok;
}

module.exports = { collectBlock, collectItem };