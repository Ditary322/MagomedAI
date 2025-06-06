const fs = require('fs');
const path = require('path');
const { registerGoalType } = require('./goal_loader');

const goalDir = __dirname;

fs.readdirSync(goalDir)
  .filter(file => file.endsWith('_goal.js'))
  .forEach(file => {
    const goalModule = require(path.join(goalDir, file));
    const type = file.split('_')[0]; // build_goal.js → build
    registerGoalType(type, goalModule);
  });
