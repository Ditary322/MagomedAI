const blocks = require('./blocks');
const entities = require('./entities');
const inventory = require('./inventory');
const space = require('./space');

module.exports = {
  ...blocks,
  ...entities,
  ...inventory,
  ...space
};
