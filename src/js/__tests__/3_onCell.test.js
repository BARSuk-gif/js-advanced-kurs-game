import { Bowman } from '../characters/Bowman.js';
import GameController from '../GameController.js';
import PositionedCharacter from '../PositionedCharacter.js';

describe('gameController._getCharacterInfo', () => {
  let controller;    
  
  beforeEach(() => {
    // 1. Создаём моки
    const mockGamePlay = { boardSize: 8 };
    const mockstateService = {};

    // 2. Создаём контроллер
    controller = new GameController(mockGamePlay, mockstateService);

    // Создаём тестового персонажа с известными характеристиками
    const testCharacter = new Bowman(2);
    const position = 5;

    // Создаём объект PositionedCharacter
    const positionedChar = new PositionedCharacter(testCharacter, position);

    // Напрямую записываем его в массив контроллера
    controller.allCharacters = [positionedChar];

    // Сбрасываем occupiedPositions, если он есть (чтобы не мешал)
    controller.occupiedPositions = new Set();
  });

  test('should return formatted info for existing character', () => {
    const info = controller.getCharacterInfo(5);
    expect(info).toBe('🎖2 ⚔25 🛡25 ❤50');
  });  

  test('should return null for empty cell', () => {
    const info = controller.getCharacterInfo(10);
    expect(info).toBeNull();
  });  
});