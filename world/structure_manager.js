// models/MineCraft/world/structure_manager.js

const fs   = require('fs');
const path = require('path');

const STRUCTURE_FOLDER = path.join(__dirname, '..', 'data', 'structures');

/**
 * Загружает JSON-структуру по ID (например "small_wood_house")
 */
function loadStructure(id) {
  const filePath = path.join(STRUCTURE_FOLDER, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`⛔ Структура "${id}" не найдена по пути ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`❌ Ошибка при чтении структуры "${id}":`, err.message);
    return null;
  }
}

/**
 * Сохраняет объект data в JSON-файл по ID
 */
function saveStructure(id, data) {
  const filePath = path.join(STRUCTURE_FOLDER, `${id}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Структура "${id}" сохранена в ${filePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Ошибка при сохранении структуры "${id}":`, err.message);
    return false;
  }
}

/**
 * Ищет и возвращает первый встреченный блок с именем blockName
 * @param {import('mineflayer').Bot} bot 
 * @param {string} blockName 
 * @param {number} [maxDistance=64] 
 * @returns {import('prismarine-block').Block|null}
 */
function getNearestBlock(bot, blockName, maxDistance = 64) {
  const pos = bot.findBlock({
    matching: b => b.name === blockName,
    maxDistance,
    count: 1
  });
  return pos ? bot.blockAt(pos) : null;
}

/**
 * Возвращает все блоки с именами из массива blockNames в радиусе maxDistance
 * @param {import('mineflayer').Bot} bot 
 * @param {string[]} blockNames 
 * @param {number} [maxDistance=64] 
 * @returns {import('prismarine-block').Block[]}
 */
function getNearestBlocks(bot, blockNames, maxDistance = 64) {
  const positions = bot.findBlocks({
    matching: b => blockNames.includes(b.name),
    maxDistance,
    count: maxDistance
  });
  return positions
    .map(pos => bot.blockAt(pos))
    .filter(b => b != null);
}

/**
 * Находит ближайший воздушный блок (air) для постройки в радиусе maxDistance
 * @param {import('mineflayer').Bot} bot 
 * @param {number} [minDistance=1] — минимальное удаление от игрока (не реализовано, для будущего)
 * @param {number} [maxDistance=64] 
 * @returns {import('prismarine-block').Vec3|null}
 */
function getNearestFreeSpace(bot, minDistance = 1, maxDistance = 64) {
  const pos = bot.findBlock({
    matching: b => b.name === 'air',
    maxDistance,
    count: 1
  });
  return pos || null;
}

module.exports = {
  loadStructure,
  saveStructure,
  getNearestBlock,
  getNearestBlocks,
  getNearestFreeSpace
};
