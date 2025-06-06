function parseArgs(argString) {
  try {
    return JSON.parse(`[${argString}]`);
  } catch {
    return [];
  }
}

module.exports = { parseArgs };
