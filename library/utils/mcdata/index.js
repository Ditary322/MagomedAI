const fs = require('fs');
const path = require('path');

const items = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../data/minecraft/items.json'), 'utf-8'));
const recipesRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../data/minecraft/recipes.json'), 'utf-8'));

// Преобразуем recipes из [["123", [{...}]], ...] → Map
const recipes = new Map(recipesRaw.map(([id, list]) => [parseInt(id), list]));

function getItemById(id) {
  return items.find(i => i.id === id) || null;
}

function getItemIdByName(name) {
  const item = items.find(i => i.name === name);
  return item ? item.id : null;
}

function getItem(nameOrId) {
  if (typeof nameOrId === 'number') return getItemById(nameOrId);
  if (typeof nameOrId === 'string') {
    const id = getItemIdByName(nameOrId);
    return getItemById(id);
  }
  return null;
}

function getRecipesByName(name) {
  const id = getItemIdByName(name);
  return recipes.get(id) || [];
}

function getAllItems() {
  return items;
}

module.exports = {
  getItemById,
  getItemIdByName,
  getItem,
  getRecipesByName,
  getAllItems
};