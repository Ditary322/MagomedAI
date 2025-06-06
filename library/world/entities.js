function getNearbyEntities(bot, radius = 16) {
    const entities = Object.values(bot.entities);
    return entities.filter(e => {
      return e.position.distanceTo(bot.entity.position) <= radius &&
             e.type !== 'object' && e !== bot.entity;
    });
  }
  
  function getNearestEntity(bot, filterFn = () => true, radius = 16) {
    const entities = getNearbyEntities(bot, radius).filter(filterFn);
    if (entities.length === 0) return null;
  
    entities.sort((a, b) =>
      a.position.distanceTo(bot.entity.position) -
      b.position.distanceTo(bot.entity.position)
    );
  
    return entities[0];
  }
  
  module.exports = {
    getNearbyEntities,
    getNearestEntity
  };
  