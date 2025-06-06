const { spawn } = require('child_process');
const path = require('path');

const PY = 'python'; // или 'python' на Windows
const ENGINE = path.resolve(__dirname, '../../../memory/engine.py');

function match(goal) {
  const action = goal.action || goal?.plan?.[0]?.action;
  return ['remember_location', 'mark_area', 'remember_player'].includes(action);
}

function runEngineCommand(args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PY, [ENGINE, ...args]);

    let out = '';
    proc.stdout.on('data', data => (out += data.toString()));
    proc.stderr.on('data', err => console.error('[engine.py]', err.toString()));

    proc.on('close', code => {
      if (code === 0) resolve(out.trim());
      else reject(new Error('engine.py exited with code ' + code));
    });
  });
}

async function execute(bot, goal) {
  const step = goal.plan?.[0] || goal;
  const action = step.action;

  if (step.message) bot.chat(step.message);

  const pos = bot.entity?.position?.floored();
  const username = bot.username;
  const world = `${username}_overworld`; // можно расширить

  if (action === 'remember_location') {
    const name = step.name || `loc_${Date.now()}`;
    await runEngineCommand(['remember', world, name, pos.x, pos.y, pos.z]);
    return true;
  }

  if (action === 'mark_area') {
    const name = step.name || `zone_${Date.now()}`;
    const radius = step.radius || 10;
    await runEngineCommand(['remember_area', world, name, pos.x, pos.y, pos.z, radius]);
    return true;
  }

  if (action === 'remember_player') {
    const target = step.name;
    const entity = bot.players?.[target]?.entity;
    if (!entity) return false;
    const ep = entity.position.floored();
    await runEngineCommand(['remember', world, `player_${target}`, ep.x, ep.y, ep.z]);
    return true;
  }

  return false;
}

module.exports = { match, execute };
