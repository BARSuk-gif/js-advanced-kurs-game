import { calcTileType } from '../utils.js';

describe('.calcTileType()', () => {
  test.each([
    [0, 8, 'top-left'],
    [1, 8, 'top'],
    [7, 8, 'top-right'],
    [10, 8, 'center'],
    [16, 8, 'left'],
    [39, 8, 'right'],
    [56, 8, 'bottom-left'],
    [63, 8, 'bottom-right'],
    [60, 8, 'bottom']
  ])('returns %s depending on the position of the cell in the square field', (index, boardSize, expected) => {
    expect(calcTileType(index, boardSize)).toBe(expected);      
  });
});