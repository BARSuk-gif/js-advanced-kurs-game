import GameController from '../GameController.js';
import GamePlay from '../GamePlay.js';
import GameState from '../GameState.js';
import { Bowman } from '../characters/Bowman.js';
import { Swordsman } from '../characters/Swordsman.js';
import { Magician } from '../characters/Magician.js';
import { Daemon } from '../characters/Daemon.js';
import { Vampire } from '../characters/Vampire.js';
import { Undead } from '../characters/Undead.js';
import PositionedCharacter from '../PositionedCharacter.js';

describe('getMoveRadius', () => {
  let controller;

  beforeEach(() => {
    const mockGamePlay = {};
    const mockStateServis = {};
    controller = new GameController(mockGamePlay, mockStateServis);
  });

  test('Swordsman should have move radius 4', () => {
    const swordsman = new Swordsman(1);
    expect(controller.getMoveRadius(swordsman)).toBe(4);
  });

  test('Undead should have move radius 4', () => {
    const undead = new Undead(1);
    expect(controller.getMoveRadius(undead)).toBe(4);
  });

  test('Bowman should have move radius 2', () => {
    const bowman = new Bowman(1);
    expect(controller.getMoveRadius(bowman)).toBe(2);
  });

  test('Vampire should have move radius 2', () => {
    const vampire = new Vampire(1);
    expect(controller.getMoveRadius(vampire)).toBe(2);
  });

  test('Magician should have move radius 1', () => {
    const magician = new Magician(1);
    expect(controller.getMoveRadius(magician)).toBe(1);
  });

  test('Daemon should have move radius 1', () => {
    const daemon = new Daemon(1);
    expect(controller.getMoveRadius(daemon)).toBe(1);
  });

  test('Unknown character should return 0', () => {
    const unknown = { type: 'Unknown' };
    expect(controller.getMoveRadius(unknown)).toBe(0);
  });
});

describe('getAttackRadius', () => {
  let controller;

  beforeEach(() => {
    const mockGamePlay = {};
    const mockStateServis = {};
    controller = new GameController(mockGamePlay, mockStateServis);
  });

  test('Swordsman should have attack radius 1', () => {
    const swordsman = new Swordsman(1);
    expect(controller.getAttackRadius(swordsman)).toBe(1);
  });

  test('Undead should have attack radius 1', () => {
    const undead = new Undead(1);
    expect(controller.getAttackRadius(undead)).toBe(1);
  });

  test('Bowman should have attack radius 2', () => {
    const bowman = new Bowman(1);
    expect(controller.getAttackRadius(bowman)).toBe(2);
  });

  test('Vampire should have attack radius 2', () => {
    const vampire = new Vampire(1);
    expect(controller.getAttackRadius(vampire)).toBe(2);
  });

  test('Magician should have attack radius 4', () => {
    const magician = new Magician(1);
    expect(controller.getAttackRadius(magician)).toBe(4);
  });

  test('Daemon should have attack radius 4', () => {
    const daemon = new Daemon(1);
    expect(controller.getAttackRadius(daemon)).toBe(4);
  });

  test('Unknown character should return 0', () => {
    const unknown = { type: 'Unknown' };
    expect(controller.getAttackRadius(unknown)).toBe(0);
  });
});


// Проверка направления движения
describe('isCellInRange', () => {
  let controller;

  beforeEach(() => {
    const mockGamePlay = { boardSize: 8 };
    const mockStateServis = {};
    controller = new GameController(mockGamePlay, mockStateServis);
  });

  test('Should allow horizontal movement within maxDistance', () => {
    // С клетки 0 (0,0) на клетку 3 (0,3) - расстояние 3
    expect(controller.isCellInRange(0, 3, 4)).toBe(true);
    expect(controller.isCellInRange(0, 3, 2)).toBe(false);
  });

  test('Should allow vertical movement within maxDistance', () => {
    // С клетки 0 (0,0) на клетку 16 (2,0) - расстояние 2
    expect(controller.isCellInRange(0, 16, 2)).toBe(true);
    expect(controller.isCellInRange(0, 16, 1)).toBe(false);
  });

  test('Should allow movement within maxDistance', () => {
    // С клетки 10 (1,2) на клетку 18 (2,2) - расстояние 1
    expect(controller.isCellInRange(10, 18, 2)).toBe(true);
  });

  test('Should allow diagonal movement within maxDistance', () => {
    // С клетки 0 (0,0) на клетку 9 (1,1) - расстояние 1
    expect(controller.isCellInRange(0, 9, 2)).toBe(true);

    // С клетки 0 (0,0) на клетку 18 (2,2) - расстояние 2
    expect(controller.isCellInRange(0, 18, 2)).toBe(true);

    // С клетки 0 (0,0) на клетку 27 (3,3) - расстояние 3
    expect(controller.isCellInRange(0, 27, 4)).toBe(true);
  });

  test('Should NOT allow diagonal movement if distance exceeds maxDistance', () => {
    // С клетки 0 (0,0) на клетку 27 (3,3) - расстояние 3
    expect(controller.isCellInRange(0, 27, 2)).toBe(false);
    expect(controller.isCellInRange(0, 27, 1)).toBe(false);
  });

  test('Should NOT allow movement that is not straight or diagonal', () => {
    // С клетки 0 (0,0) на клетку 10 (1,2) - не прямая и не диагональ
    expect(controller.isCellInRange(0, 10, 4)).toBe(false);

    // С клетки 5 (0,5) на клетку 19 (3,2) - не прямая и не диагональ
    expect(controller.isCellInRange(5, 20, 4)).toBe(false);
  });

  test('Should NOT allow movement to the same cell', () => {
    expect(controller.isCellInRange(0, 0, 4)).toBe(false);
    expect(controller.isCellInRange(15, 15, 4)).toBe(false);
  });
});

describe('determineAction - move', () => {
  let controller;
  let mockGamePlay;

  beforeEach(() => {
    mockGamePlay = { boardSize: 8 };
    const mockStateService = {};
    controller = new GameController(mockGamePlay, mockStateService);

    // Создаем персонажа игрока (Swordsman) на позиции 0
    const swordsman = new Swordsman(1);
    const PositionedChar = new PositionedCharacter(swordsman, 0);
    controller.allCharacters = [PositionedChar];
    controller.selectedIndex = 0;
    controller.selectedCharacter = swordsman;
  });

  test('Swordsman should be able to move to empty cell within 4 cells', () => {
    // Пустая клетка на расстоянии 3 (0,0) -> (0,3)
    const result = controller.determineAction(3);
    expect(result.action).toBe('move');
  });

  test('Swordsman should NOT be able to move to empty cell beyond 4 cells', () => {
    // Пустая клетка на расстоянии 5 (0,0) -> (0,5)
    const result = controller.determineAction(5);
    expect(result.action).toBe('invalid');
    expect(result.reason).toBe('Недоступно для перемещения');
  });

  test('Swordsman should NOT be able to move to non-straight/non-diagonal cell', () => {
    // Клетка (1,2) - не прямая и не диагональ от (0,0)
    const result = controller.determineAction(10);
    expect(result.action).toBe('invalid');
  });
});

describe('determineAction - attack', () => {
  let controller;
  let mockGamePlay;

  beforeEach(() => {
    mockGamePlay = { boardSize: 8 };
    const mockStateService = {};
    controller = new GameController(mockGamePlay, mockStateService);

    // Создаем персонажа игрока (Swordsman) на позиции 0
    const swordsman = new Swordsman(1);
    const playerChar = new PositionedCharacter(swordsman, 0);

    // Создаем врага (Daemon) на позиции 9 (1,1) - расстояние 1
    const daemon = new Daemon(1);
    const enemyChar = new PositionedCharacter(daemon, 9);

    controller.allCharacters = [playerChar, enemyChar];
    controller.selectedIndex = 0;
    controller.selectedCharacter = swordsman;
  });

  test('Swordsman should be able to attack enemy within 1 cell', () => {
    // Враг на расстоянии 1
    const result = controller.determineAction(9);
    expect(result.action).toBe('attack');
  });

  test('Swordsman should NOT be able to attack enemy beyond 1 cell', () => {
    // Создаем врага на расстоянии 2 (0,0) -> (0,2)
    const daemon2 = new Daemon(1);
    const enemyChar2 = new PositionedCharacter(daemon2, 2);
    controller.allCharacters.push(enemyChar2);

    const result = controller.determineAction(2);
    expect(result.action).toBe('invalid');
    expect(result.reason).toBe('Противник вне радиуса атаки');
  });
});

describe('determineAction - different character types', () => {
  let controller;
  let mockGamePlay;

  beforeEach(() => {
    mockGamePlay = { boardSize: 8 };
    const mockStateServis = {};
    controller = new GameController(mockGamePlay, mockStateServis);    
  });

  test('Bowman should move 2 cells and attack 2 cells', () => {
    const bowman = new Bowman(1);
    const playerChar = new PositionedCharacter(bowman, 0);

    // Враг на расстоянии 2
    const daemon = new Daemon(1);
    const enemyChar = new PositionedCharacter(daemon, 2);

    controller.allCharacters = [playerChar, enemyChar];
    controller.selectedIndex = 0;
    controller.selectedCharacter = bowman;

    // Может атаковать на расстоянии 2
    expect(controller.determineAction(2).action).toBe('attack');

    // Не может атаковать на расстоянии 3
    const daemon2 = new Daemon(1);
    const enemyChar2 = new PositionedCharacter(daemon2, 3);
    controller.allCharacters.push(enemyChar2);
    expect(controller.determineAction(3).action).toBe('invalid');
  });

  test('Magician should move 1 cell and attack 4 cells', () => {
    const magician = new Magician(1);
    const playerChar = new PositionedCharacter(magician, 0);

    // Враг на расстоянии 4
    const daemon = new Daemon(1);
    const enemyChar = new PositionedCharacter(daemon, 4);

    controller.allCharacters = [playerChar, enemyChar];
    controller.selectedIndex = 0;
    controller.selectedCharacter = magician;

    // Может атаковать на расстоянии 4
    expect(controller.determineAction(4).action).toBe('attack');

    // Не может двигаться на расстояние 2 (только 1)
    const result = controller.determineAction(2);
    expect(result.action).toBe('invalid');
    expect(result.reason).toBe('Недоступно для перемещения');
  });
});