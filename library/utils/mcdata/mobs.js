/**
 * Является ли моб охотничьим (еда, кожа и т.п.)
 */
function isHuntable(mob) {
    if (!mob || !mob.name) return false;
    const animals = [
      'chicken', 'cow', 'llama', 'mooshroom',
      'pig', 'rabbit', 'sheep'
    ];
    return animals.includes(mob.name.toLowerCase()) && !isBaby(mob);
  }
  
  /**
   * Является ли моб детёнышем
   */
  function isBaby(mob) {
    return mob?.metadata?.[16] === true; // 16 = baby tag
  }
  
  /**
   * Враждебен ли моб по умолчанию
   */
  function isHostile(mob) {
    const hostiles = [
      'zombie', 'skeleton', 'creeper', 'spider',
      'enderman', 'witch', 'slime', 'phantom',
      'pillager', 'vindicator', 'ravager', 'warden'
    ];
    return hostiles.includes(mob.name.toLowerCase());
  }
  
  module.exports = {
    isHuntable,
    isHostile,
    isBaby
  };
  