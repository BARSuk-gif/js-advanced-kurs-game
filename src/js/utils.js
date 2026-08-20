export function calcTileType(index, boardSize) {
  let row = Math.floor(index / boardSize);
  let col = index % boardSize;

  if (row === 0) {
    if (col === 0) {return 'top-left';}
    if (col === boardSize -1) {return 'top-right';}
    return 'top';
  };

  if (row === boardSize - 1) {
    if (col === 0) {return 'bottom-left';}
    if (col === boardSize - 1) {return 'bottom-right';}
    return 'bottom';
  };

  if (row != 0 && row != boardSize - 1) {
    if (col === 0) {return 'left';}
    if (col === boardSize - 1) {return 'right';}
  }

  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
