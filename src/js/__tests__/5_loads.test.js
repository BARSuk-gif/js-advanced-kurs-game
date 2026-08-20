import GameController from '../GameController.js';
import GamePlay from '../GamePlay.js';
import GameState from '../GameState.js';

// Мокаем GamePlay статические методы
jest.mock('../GamePlay.js', () => ({
  showError: jest.fn(), 
  showMessage: jest.fn(),   
}));

describe('GameController - load method tests', () => {
  let controller;
  let mockGamePlay;
  let mockStateService;

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    jest.clearAllMocks();

    // Создаем mock для GamePlay
    mockGamePlay = {
      drawUi: jest.fn(),
      redrawPositions: jest.fn(),
      addCellEnterListener: jest.fn(),
      addCellLeaveListener: jest.fn(),
      addCellClickListener: jest.fn(),
      addNewGameListener: jest.fn(),
      addSaveGameListener: jest.fn(),
      addLoadGameListener: jest.fn(),
      setCursor: jest.fn(),
      boardEl: { style: { pointerEvents: 'auto' } },
      boardSize: 8,
    };

    // Создаем mock для stateService
    mockStateService = {
      load: jest.fn(),
      save: jest.fn(),
    };

    // Создаем контроллер
    controller = new GameController(mockGamePlay, mockStateService);

    // Мокаем методы контроллера для тестирования
    controller.restoreCharacters= jest.fn();
    controller.startNewGame = jest.fn();
    controller.computerTurn = jest.fn();
    controller.generatePositions = jest.fn();
    controller.gamePlay = mockGamePlay;
    controller.gameState = new GameState();
  });

  //  Успешная загрузка сохранения
  test('should successfully load saved game and restore state', () => {
    // Подготавливаем сохраненные данные
    const savedState = {
      currentTurn: 'player',
      level: 2,
      score: 150,
      maxScore: 200,
      theme: 'desert',
      characters: [
        {
          type: 'Bowman',
          level: 2,
          health: 80,
          attack: 30,
          defence: 20,
          position: 0
        }
      ],
      occupiedPositions: [0]
    };

    // Настраиваем mock load для успешного возврата
    mockStateService.load.mockReturnValue(savedState);

    // Шпионим за GameState.from
    const fromSpy = jest.spyOn(GameState, 'from');

    controller.init();

    expect(mockStateService.load).toHaveBeenCalled();
    expect(fromSpy).toHaveBeenCalledWith(savedState);

    // Проверяем состояние
    expect(controller.gameState.currentTurn).toBe('player');
    expect(controller.gameState.level).toBe(2);
    expect(controller.gameState.score).toBe(150);
    expect(controller.gameState.theme).toBe('desert');

    expect(controller.restoreCharacters).toHaveBeenCalledWith(savedState.characters);
    expect(mockGamePlay.drawUi).toHaveBeenCalledWith('desert');
    expect(mockGamePlay.redrawPositions).toHaveBeenCalled();
    expect(controller.startNewGame).not.toHaveBeenCalled();

    fromSpy.mockRestore();
  });

  // Успешная загрузка с ходом компьютера
  test('should start computer turn if saved game has computer turn', () => {
    const savedState = {
      currentTurn: 'computer',
      level: 1,
      score: 0,
      maxScore: 0,
      theme: 'prairie',
      characters: [],
      occupiedPositions: []
    };

    mockStateService.load.mockReturnValue(savedState);

    // Шпионим за GameState.from
    const fromSpy = jest.spyOn(GameState, 'from');

    controller.init();

    expect(mockStateService.load).toHaveBeenCalled();
    expect(fromSpy).toHaveBeenCalledWith(savedState);
    expect(controller.computerTurn).toHaveBeenCalled();

    fromSpy.mockRestore();
  });

  // Неуспешная загрузка - сохранение не найдено
  test('should start new game when no saved game found', () => {
    mockStateService.load.mockReturnValue(null);

    controller.init();

    expect(mockStateService.load).toHaveBeenCalled();
    expect(controller.startNewGame).toHaveBeenCalled();
    expect(controller.restoreCharacters).not.toHaveBeenCalled();
    expect(GamePlay.showError).not.toHaveBeenCalled();
  });

  //  Неуспешная загрузка - ошибка при загрузке
  test('should start new game when load throws exception', () => {
    const errorMessage = 'Failed to load game data';
    mockStateService.load.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    // Шпионим за console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    controller.init();

    expect(mockStateService.load).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Сохраненная игра не найдена, начинаем новую игру'
    );
    expect(controller.startNewGame).toHaveBeenCalled();
    expect(GamePlay.showError).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // onLoadGame - успешная загрузка через кнопку
  test('onLoadGame should load game and show success message', () => {
    const savedState = {
      currentTurn: 'player',
      level: 3,
      score: 250,
      maxScore: 300,
      theme: 'arctic',
      characters: [],
      occupiedPositions: []
    };

    mockStateService.load.mockReturnValue(savedState);

    // Шпионим за методами
    const fromSpy = jest.spyOn(GameState, 'from');
    const restoreSpy = jest.spyOn(controller, 'restoreCharacters');

    // Вызываем onLoadGame
    controller.onLoadGame();

    // Проверяем, что stateService.load был вызван
    expect(mockStateService.load).toHaveBeenCalled();    
    expect(fromSpy).toHaveBeenCalledWith(savedState);
    expect(restoreSpy).toHaveBeenCalledWith(savedState.characters);
    expect(mockGamePlay.drawUi).toHaveBeenCalledWith('arctic');
    expect(mockGamePlay.redrawPositions).toHaveBeenCalled();
    expect(GamePlay.showMessage).toHaveBeenCalledWith('Игра загружена!');
    expect(GamePlay.showError).not.toHaveBeenCalled();

    fromSpy.mockRestore();
    restoreSpy.mockRestore();
  });


  // onLoadGame - ошибка при загрузке
  test('onLoadGame should show error when load fails', () => {
    const errorMessage = 'Corrupted save data';
    mockStateService.load.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    // Вызываем onLoadGame
    controller.onLoadGame();

    // Проверяем, что stateService.load был вызван
    expect(mockStateService.load).toHaveBeenCalled();

    // Проверяем, что GamePlay.showError был вызван с сообщением об ошибке
    expect(GamePlay.showError).toHaveBeenCalledWith('Не удалось загрузить игру');

    // Проверяем, что GamePlay.showMessage НЕ был вызван
    expect(GamePlay.showMessage).not.toHaveBeenCalled();
  });

  // Проверка восстановления GameState.from
  test('GameState.from should correctly restore state from object', () => {
    const savedState = {
      currentTurn: 'computer',
      level: 2,
      score: 100,
      maxScore: 150,
      theme: 'mountain',
      characters: [{ type: 'Bowman', level: 2, health: 80 }],
      occupiedPositions: [0, 1, 2]
    };

    const restoredState = GameState.from(savedState);

    expect(restoredState.currentTurn).toBe('computer');
    expect(restoredState.level).toBe(2);
    expect(restoredState.score).toBe(100);
    expect(restoredState.maxScore).toBe(150);
    expect(restoredState.theme).toBe('mountain');
    expect(restoredState.characters).toEqual([{ type: 'Bowman', level: 2, health: 80 }]);
    expect(restoredState.occupiedPositions).toEqual(new Set([0, 1, 2]));
  });

  // Проверка GameState.from с пустыми данными
  test('GameState.from should use default values when data is missing', () => {
    const savedState = {};

    const restoredState = GameState.from(savedState);

    expect(restoredState.currentTurn).toBe('player');
    expect(restoredState.level).toBe(1);
    expect(restoredState.score).toBe(0);
    expect(restoredState.maxScore).toBe(0);
    expect(restoredState.theme).toBe('prairie');
    expect(restoredState.characters).toEqual([]);
    expect(restoredState.occupiedPositions).toEqual(new Set());
  });

  // Проверка saveGame
  test('saveGame should save current game state', () => {
    // Настраиваем контроллер с тестовыми данными
    const testCharacters = [
      { 
        character: { 
          constructor: { name: 'Bowman' }, 
          level: 1, 
          health: 100, 
          attack: 25, 
          defence: 25 
        }, 
        position: 0 
      }
    ];
    const testOccupiedPositions = new Set([0]);

    controller.allCharacters = testCharacters;
    controller.occupiedPositions = testOccupiedPositions;
    controller.gameState.currentTurn = 'player';
    controller.gameState.level = 1;
    controller.gameState.score = 0;
    controller.gameState.maxScore = 0;
    controller.gameState.theme = 'prairie';

    // Мокаем toJSON
    const toJSONSpy = jest.spyOn(controller.gameState, 'toJSON');

    // Вызываем saveGame
    controller.saveGame();

    // Проверяем, что toJSON был вызван с правильными параметрами
    expect(toJSONSpy).toHaveBeenCalledWith(testCharacters, testOccupiedPositions);

    // Проверяем, что stateService.save был вызван
    expect(mockStateService.save).toHaveBeenCalled();

    toJSONSpy.mockRestore();
  });
});