const goalTypes = {};

function registerGoalType(type, module) {
  goalTypes[type] = module;
}

function getGoalHandler(goal) {
  for (const type in goalTypes) {
    if (goalTypes[type].match(goal)) return goalTypes[type];
  }
  console.warn(`[goal_loader] Не найден обработчик для цели:`, goal);
  return null;
}

module.exports = {
  registerGoalType,
  getGoalHandler,
  goalTypes
};
