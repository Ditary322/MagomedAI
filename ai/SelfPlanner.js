const { executePlan } = require('../library/plan_executor');
const { queryGoal } = require('../../core/llm'); // ← твой боевой llm-интерфейс

class SelfPlanner {
  constructor(bot) {
    this.bot = bot;
    this.stopped = false;
  }

  async start(goalText) {
    if (this.stopped) return;

    try {
      this.bot.chat('🧠 Думаю…');
      const plan = await queryGoal(goalText);

      if (!Array.isArray(plan) || plan.length === 0) {
        this.bot.chat('❌ План пустой или невалидный');
        return;
      }

      await executePlan(this.bot, plan);
    } catch (err) {
      this.bot.chat(`❌ Ошибка мышления: ${err.message}`);
    }
  }

  pause() {
    this.stopped = true;
  }

  resume() {
    this.stopped = false;
  }

  stop() {
    this.stopped = true;
  }
}

module.exports = SelfPlanner;
