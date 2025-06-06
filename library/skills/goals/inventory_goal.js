function match(goal) {
  const action = goal.action || goal?.plan?.[0]?.action;
  return ['drop', 'take', 'store'].includes(action);
}

async function execute(bot, goal) {
  const step = goal.plan?.[0] || goal;
  const { action, item, count = 1 } = step;

  if (step.message) bot.chat(step.message);

  if (!item) return false;

  const slot = bot.inventory.items().find(i => i.name === item);
  if (!slot) return false;

  if (action === 'drop') {
    try {
      await bot.toss(slot.type, null, count);
      return true;
    } catch {
      return false;
    }
  }

  if (action === 'store' || action === 'take') {
    const chestBlock = bot.findBlock({ matching: b => b.name.includes('chest'), maxDistance: 6 });
    if (!chestBlock) return false;

    const chest = await bot.openChest(chestBlock);
    try {
      if (action === 'store') {
        await chest.deposit(slot.type, null, count);
      } else {
        await chest.withdraw(slot.type, null, count);
      }
      chest.close();
      return true;
    } catch {
      chest.close();
      return false;
    }
  }

  return false;
}

module.exports = { match, execute };
