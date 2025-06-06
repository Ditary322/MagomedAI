function getBlockAtPosition(bot, x, y, z) {
    return bot.blockAt(bot.vec3(x, y, z));
  }
  
  function getNearestBlock(bot, blockName, range = 32) {
    const block = bot.findBlock({
      matching: (b) => b && b.name === blockName,
      maxDistance: range
    });
    return block || null;
  }
  
  function getNearestBlocks(bot, blockNames = [], range = 32) {
    return bot.findBlocks({
      matching: (b) => b && blockNames.includes(b.name),
      maxDistance: range,
      count: 10
    }).map(pos => bot.blockAt(pos));
  }
  
  module.exports = {
    getBlockAtPosition,
    getNearestBlock,
    getNearestBlocks
  };
  