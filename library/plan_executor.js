const { getGoalHandler } = require('../skills/goals/goal_loader');

async function executePlan(bot, plan = []) {
  for (let i = 0; i < plan.length; i++) {
    const step = plan[i];

    const handler = getGoalHandler(step);
    if (!handler) {
      bot.chat(`❌ Неизвестное действие: ${step.action}`);
      return false;
    }

    try {
      const ok = await handler.execute(bot, { plan: [step] });
      if (!ok) {
        bot.chat(`⚠️ Действие ${step.action} провалено`);
        return false;
      }

      // 🔁 Выполнить subplan, если он есть
      if (Array.isArray(step.subplan) && step.subplan.length > 0) {
        const success = await executePlan(bot, step.subplan);
        if (!success) return false;
      }

    } catch (err) {
      bot.chat(`❌ Ошибка на шаге ${i + 1}: ${err.message}`);
      return false;
    }
  }

  return true;
}

module.exports = { executePlan };
