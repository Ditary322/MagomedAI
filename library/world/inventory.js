function getInventoryCounts(bot) {
    const counts = {};
    const items = bot.inventory.items();
  
    for (const item of items) {
      if (!counts[item.name]) {
        counts[item.name] = 0;
      }
      counts[item.name] += item.count;
    }
  
    return counts;
  }
  
  module.exports = {
    getInventoryCounts
  };
  