const minecraftData = require('minecraft-data');
const prismarineItems = require('prismarine-item');

// ⚠ Укажи актуальную версию своей игры
const mc_version = '1.21.1';

const mcdata = minecraftData(mc_version);
const Item = prismarineItems(mc_version);

module.exports = {
  mcdata,
  Item
};
