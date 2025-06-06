const fs   = require('fs');
const path = require('path');

// Загружаем датасет блоков
const blocksData = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../data/minecraft/blocks.json'),
    'utf-8'
  )
);

/**
 * Возвращает список вариантов имён блока для добычи:
 * – базовое имя
 * – варианты руд (ore, deepslate_ore)
 * – grass_block для dirt
 */
function getBlockVariants(blockName) {
  const lower = blockName.toLowerCase();
  const variants = [];

  // базовое имя, если есть в датасете
  const base = blocksData.find(b =>
    b.name.toLowerCase() === lower ||
    (b.displayName && b.displayName.toLowerCase() === lower)
  );
  variants.push(base ? base.name : blockName);

  // для руд добавляем deepslate-вариант
  if (blockName.endsWith('_ore')) {
    const ds = `deepslate_${blockName}`;
    if (blocksData.some(b => b.name === ds)) variants.push(ds);
  } else {
    // общие руды без суффикса "_ore"
    const ores = ['coal','diamond','emerald','iron','gold','lapis_lazuli','redstone'];
    if (ores.includes(blockName)) {
      const ore        = `${blockName}_ore`;
      const ds_ore     = `deepslate_${ore}`;
      if (blocksData.some(b => b.name === ore)) variants.push(ore);
      if (blocksData.some(b => b.name === ds_ore)) variants.push(ds_ore);
    }
  }

  // grass_block для dirt
  if (blockName === 'dirt' && blocksData.some(b => b.name === 'grass_block')) {
    variants.push('grass_block');
  }

  return variants;
}

module.exports = { getBlockVariants };
