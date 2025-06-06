const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.resolve(__dirname, '../../../data/memory.json');

function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

function match(goal) {
  const a = goal.action || goal?.plan?.[0]?.action;
  return ['remember_location', 'mark_area', 'remember_player'].includes(a);
}

async function execute(bot, goal) {
  const step = goal.plan?.[0] || goal;
  const action = step.action;
  const memory = loadMemory();

  if (step.message) bot.chat(step.message);

  if (action === 'remember_location') {
    const name = step.name || 'default_location';
    const pos = bot.entity.position.floored();
    memory.locations = memory.locations || {};
    memory.locations[name] = { x: pos.x, y: pos.y, z: pos.z };
    saveMemory(memory);
    return true;
  }

  if (action === 'mark_area') {
    const name = step.name || 'area_' + Date.now();
    const center = bot.entity.position.floored();
    memory.areas = memory.areas || {};
    memory.areas[name] = {
      x: center.x,
      y: center.y,
      z: center.z,
      radius: step.radius || 10
    };
    saveMemory(memory);
    return true;
  }

  if (action === 'remember_player') {
    const player = step.name;
    const entity = bot.players[player]?.entity;
    if (!entity) return false;

    memory.players = memory.players || {};
    memory.players[player] = {
      x: entity.position.x,
      y: entity.position.y,
      z: entity.position.z
    };
    saveMemory(memory);
    return true;
  }

  return false;
}

module.exports = { match, execute };
