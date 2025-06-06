const SelfPlanner = require('./SelfPlanner');
const { parseArgs } = require('../utils/commandParser');
const skills = require('../skills');

let selfPlannerInstance = null;

const commands = {
  ...skills,

  self: async (bot, goalText) => {
    if (!selfPlannerInstance) selfPlannerInstance = new SelfPlanner(bot);
    await selfPlannerInstance.start(goalText);
  },
  selfPause: async () => {
    if (selfPlannerInstance) selfPlannerInstance.pause();
  },
  selfResume: async () => {
    if (selfPlannerInstance) selfPlannerInstance.resume();
  },
  selfStop: async () => {
    if (selfPlannerInstance) selfPlannerInstance.stop();
  }
};

async function executeCommand(bot, input) {
  const command = input.trim();
  if (!command.startsWith("!")) return;

  const clean = command.slice(1);
  const [cmdName, argsRaw] = clean.split(/\((.*)\)/);
  const args = argsRaw ? parseArgs(argsRaw) : [];

  const fn = commands[cmdName];
  if (typeof fn !== 'function') {
    bot.chat(`❌ Неизвестная команда: ${cmdName}`);
    return;
  }

  try {
    await fn(bot, ...args);
  } catch (err) {
    bot.chat(`❌ Ошибка в команде ${cmdName}: ${err.message}`);
  }
}

module.exports = {
  executeCommand
};
