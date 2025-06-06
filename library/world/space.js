function getNearestFreeSpace(bot, size = 1, distance = 8) {
  const origin = bot.entity.position.offset(0, -1, 0);
  const checked = new Set();

  for (let x = -distance; x <= distance; x++) {
    for (let y = -2; y <= 2; y++) {
      for (let z = -distance; z <= distance; z++) {
        const dx = Math.abs(x);
        const dz = Math.abs(z);
        const dist = dx + dz + Math.abs(y);
        if (dist > distance) continue;

        const key = `${x},${y},${z}`;
        if (checked.has(key)) continue;
        checked.add(key);

        const base = origin.offset(x, y, z);
        let canPlace = true;

        for (let hx = 0; hx < size; hx++) {
          for (let hy = 0; hy < size; hy++) {
            for (let hz = 0; hz < size; hz++) {
              const check = base.offset(hx, hy + 1, hz);
              const block = bot.blockAt(check);
              if (block && block.boundingBox !== 'empty') {
                canPlace = false;
                break;
              }
            }
          }
        }

        if (canPlace) return base.floored();
      }
    }
  }

  return null;
}

/**
 * Проверка, пересекается ли прямоугольная область с другими
 */
function isOverlapping(newXMin, newXMax, newZMin, newZMax, occupiedRegions) {
  for (const region of occupiedRegions) {
    if (
      newXMin < region.xMax &&
      newXMax > region.xMin &&
      newZMin < region.zMax &&
      newZMax > region.zMin
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Найти свободное место подходящего размера на карте
 */
function findValidPosition(bot, width, depth, occupiedRegions = []) {
  const position = bot.entity.position;

  const maxXStart = Math.floor(position.x + 25 - width);
  const minXStart = Math.floor(position.x - 25);
  const maxZStart = Math.floor(position.z + 25 - depth);
  const minZStart = Math.floor(position.z - 25);

  let attempts = 0;
  while (attempts < 20) {
    const xStart = Math.floor(Math.random() * (maxXStart - minXStart + 1)) + minXStart;
    const zStart = Math.floor(Math.random() * (maxZStart - minZStart + 1)) + minZStart;
    const xEnd = xStart + width;
    const zEnd = zStart + depth;

    if (!isOverlapping(xStart, xEnd, zStart, zEnd, occupiedRegions)) {
      return { xMin: xStart, xMax: xEnd, zMin: zStart, zMax: zEnd };
    }

    attempts++;
  }

  return null;
}

module.exports = {
  getNearestFreeSpace,
  isOverlapping,
  findValidPosition
};
