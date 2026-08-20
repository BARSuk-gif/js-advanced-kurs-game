import themes from './themes.js';
import { Bowman } from './characters/Bowman.js';
import { Swordsman } from './characters/Swordsman.js';
import { Magician } from './characters/Magician.js';
import { Daemon } from './characters/Daemon.js';
import { Vampire } from './characters/Vampire.js';
import { Undead } from './characters/Undead.js';
import { generateTeam } from './generators.js';
import PositionedCharacter from './PositionedCharacter.js';
import GameState from './GameState.js';
import GamePlay from './GamePlay.js';
import cursors from './cursors.js';


export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.selectedIndex = null;  // Добавляем свойство для хранения выбранной ячейки
    this.selectedCharacter = null; // ссылка на объект выбранного персонажа
    this.gameState = null;
    this.highlightedIndex = null;  // индекс ячейки, которая сейчас подсвечена
    this.highlightedColor = 'green';  // цвет подсветки ('green' или 'red')
  }

  init() {    
    this.gamePlay.drawUi(themes.prairie);

    // СОЗДАЕМ GAMESTATE 
    this.gameState = new GameState(); 

    const playerTypes = [Bowman, Swordsman, Magician];
    const enemyTypes = [Daemon, Vampire, Undead];

    // Команда игрока
    this.playerTeam = generateTeam(playerTypes, 3, 4);
    // Команда соперника
    this.enemyTeam = generateTeam(enemyTypes, 3, 4);

    this.occupiedPositions = new Set();
    this.allCharacters = [];

    this.generatePositions(this.playerTeam, true);
    this.generatePositions(this.enemyTeam, false);
    this.gamePlay.redrawPositions(this.allCharacters);
   
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    
    // Подписываемся на кнопку New Game
    this.gamePlay.addNewGameListener(this.onNewGame.bind(this));

    // Подписываемся на кнопки Save/Load
    this.gamePlay.addSaveGameListener(this.onSaveGame.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGame.bind(this));
  
    // Пытаемся загрузить сохраненное состояние
    try {
      const savedState = this.stateService.load();
      if (savedState) {
        this.gameState = GameState.from(savedState);
        // Восстанавливаем персонажей
        this.restoreCharacters(savedState.characters);
        this.gamePlay.drawUi(this.gameState.theme);
        this.gamePlay.redrawPositions(this.allCharacters);

        // Если игра была не завершена, продолжаем
        if (this.gameState.currentTurn !== 'gameover') {
          if (this.gameState.currentTurn === 'computer') {
            this.computerTurn();
          }
        }
        return;
      }      
    } catch (e) {
      console.log('Сохраненная игра не найдена, начинаем новую игру');
    }
    // Стартуем новую игру
    this.startNewGame();
  };  

  generatePositions(team, isPlayer) {
    const boardSize = this.gamePlay.boardSize;
    const allowedColumns = isPlayer? [0, 1]: [boardSize - 2, boardSize - 1];

    const availableCells = [];    
    for (let i = 0; i < boardSize ** 2; i++) {
      const col = i % boardSize;
      if (allowedColumns.includes(col)) {
        availableCells.push(i);
      }
    } 
    
    // Перемешиваем массив
    const shuffled = availableCells.sort(() => Math.random() - 0.5);

    for (const character of team.toArray()) {
      character.health = Math.round(character.health);
      // Ищем свободную ячейку
      let position = null;
      for (const candidate of shuffled) {       
        if(!this.occupiedPositions.has(candidate)) {
          position = candidate;
          this.occupiedPositions.add(position);
          break;
        }        
      }
      if (position === null) {
        throw new Error('No available cells for placement');
      }
      this.allCharacters.push(new PositionedCharacter(character, position));
    }
  }

  generateEnemies() {
    // Удаляем всех врагов
    const playerCharacters = this.allCharacters.filter(p => 
      this.isPlayerCharacter(p.character) && p.character.health > 0
    );
    this.allCharacters = playerCharacters;

    // Очищаем occupiedPositions (оставляем только позиции игроков)
    this.occupiedPositions = new Set();
    for (const p of this.allCharacters) {
      this.occupiedPositions.add(p.position);
    }         

    // Генерируем новых врагов с уровнем, зависящим от номера уровня
    const enemyLevel = this.gameState.level;
    const enemyTypes = [Daemon, Vampire, Undead];
    const enemyTeam = generateTeam(enemyTypes, 3, enemyLevel);

    // Размещаем врагов
    this.generatePositions(enemyTeam, false);

    // Обновляем отображение
    this.gamePlay.redrawPositions(this.allCharacters);
  }

  getCharacterInfo(cellIndex) {
    for (const positioned of this.allCharacters) {
      if (positioned.position === cellIndex) {
        const char = positioned.character;
        return `🎖${char.level} ⚔${char.attack} 🛡${char.defence} ❤${char.health}`;
      }
    }
    return null;
  }
 
  getCharacterAt(index) {
    for (const positioned of this.allCharacters){
      if (positioned.position === index) {
        return positioned;
      }
    }
    return null;
  }


  isPlayerCharacter(character) {
    const playerTypes = [Bowman, Swordsman, Magician];
    return playerTypes.some(type => character instanceof type);
  }

  isEnemyCharacter(character) {
    const enemyTypes = [Daemon, Vampire, Undead];
    return enemyTypes.some(type => character instanceof type);
  }

  getMoveRadius(character) {
    if (character instanceof Swordsman || character instanceof Undead) {
      return 4;
    }
    if (character instanceof Bowman || character instanceof Vampire) {
      return 2;
    }
    if (character instanceof Magician || character instanceof Daemon) {
      return 1;
    }
    // Если вдруг не подошло — возвращаем 0 (не может ходить)
    return 0;
  }


  getAttackRadius(character) {
    if (character instanceof Swordsman || character instanceof Undead) {
      return 1;
    }
    if (character instanceof Bowman || character instanceof Vampire) {
      return 2;
    }
    if (character instanceof Magician || character instanceof Daemon) {
      return 4;
    }

    // Если вдруг не подошло — возвращаем 0 (не может атаковать)
    return 0;
  } 


  isCellInRange(startIndex, endIndex, maxDistance) {
    const boardSize = this.gamePlay.boardSize;
    const row1 = Math.floor(startIndex / this.gamePlay.boardSize);
    const col1 = startIndex % this.gamePlay.boardSize;

    const row2 = Math.floor(endIndex / this.gamePlay.boardSize);
    const col2 = endIndex % this.gamePlay.boardSize;

    const deltaRow = Math.abs(row1 - row2);
    const deltaCol = Math.abs(col1-col2);

    const distance = Math.max(deltaRow, deltaCol);

    // Если это та же клетка — невалидный ход
    if (deltaRow === 0 && deltaCol === 0) {
      return false;
    }

    // Проверяем, что движение идет по прямой или диагонали 
    const isStraight = (deltaRow === 0 || deltaCol === 0);
    const isDiagonal = (deltaRow === deltaCol);
    if (!isStraight && !isDiagonal) {
      return false;
    }

    if (distance > maxDistance) {
      return false;
    }

    // Все проверки пройдены — ход валидный
    return true;
  }


  determineAction(targetIndex) {
    // Если персонаж не выбран — не можем определить действие
    if (this.selectedIndex === null || this.selectedCharacter === null) {
      // Проверяем, есть ли в целевой ячейке персонаж игрока
      const targetPositioned = this.getCharacterAt(targetIndex);
      if (targetPositioned) {
        const targetChar = targetPositioned.character;
        if (this.isPlayerCharacter(targetChar)) {
          return { action: 'select' };
        }
      }  
      //  Если в ячейке нет персонажа игрока → нельзя ничего сделать
      return { action: 'invalid', reason: 'Выберите своего персонажа' };
    }

    // Получение выбранного персонажа
    const selectedPositioned = this.getCharacterAt(this.selectedIndex);
    if (!selectedPositioned) {
      return { action: 'invalid', reason: 'Ошибка: персонаж не найден' };
    }
    const selectedChar = selectedPositioned.character;

    // Проверка, не та же ли ячейка
    if (targetIndex === this.selectedIndex) {
      return { action: 'select' };
    }

    // Получение персонажа в целевой ячейке
    const targetPositioned = this.getCharacterAt(targetIndex);

    // Если в целевой ячейке есть персонаж
    if (targetPositioned) {
      const targetChar = targetPositioned.character;

      // если персонаж игрока - переключаем выделение на него
      if (this.isPlayerCharacter(targetChar)) {
        return { action: 'select' };
      }

      // если персонаж врага, если в радиусе атаки- атаковать
      if (this.isEnemyCharacter(targetChar)) {
        const attackRadius = this.getAttackRadius(selectedChar);
        const canAttack = this.isCellInRange(
          this.selectedIndex,
          targetIndex,
          attackRadius
        );

        if (canAttack) {
          return { action: 'attack' };
        } else {
          return { action: 'invalid', reason: 'Противник вне радиуса атаки'};
        }
      }
      // Если персонаж неизвестного типа
      return {action: 'invalid', reason: 'Неизвестный тип персонажа'};
    }

    // --- Целевая ячейка пуста ---
    const moveRadius = this.getMoveRadius(selectedChar);
    const canMove = this.isCellInRange(
      this.selectedIndex,
      targetIndex,
      moveRadius
    );

    if (canMove) {
      return {action: 'move' };
    } else {
      return {
        action: 'invalid',
        reason: 'Недоступно для перемещения'
      };
    }
  }

  async onCellClick(index) {
    // Проверяем, есть ли gameState
    if (!this.gameState) {
      console.error('GameState not initialized');
      return;
    }

    if (this.gameState.currentTurn === 'gameover') {
      GamePlay.showError('Игра окончена. Начните новую игру.');
      return;
    }

    // Проверяем, чей ход
    if (this.gameState.currentTurn !== 'player') {
      GamePlay.showError('Ход перешел к компьютеру');  //Используем статический метод
      return;
    }

    const result = this.determineAction(index);

    // Если персонаж игрока 
    if (result.action === 'select') {
      // Снимаем подсветку, если она была
      if (this.highlightedIndex !== null) {
        this.gamePlay.deselectCell(this.highlightedIndex);
        this.highlightedIndex = null;
        this.highlightedColor = null;
      }

      // Снимаем выделение с предыдущего персонажа (если был)
      if (this.selectedIndex !== null) {
        this.gamePlay.deselectCell(this.selectedIndex);
      }
      
      this.gamePlay.selectCell(index);  // Выделяем нового персонажа
      this.selectedIndex = index;  // Сохраняем индекс выбранной ячейки
      const positioned = this.getCharacterAt(index);  // Обновляем ссылку на выбранного персонажа
      this.selectedCharacter = positioned ? positioned.character : null;
      return;
    }   

    if (result.action === 'move') {
      // Проверка, что персонаж выбран
      if (this.selectedIndex === null || this.selectedCharacter === null) {
        GamePlay.showError('Персонаж не выбран');
        return;
      }

      // Проверка, что целевая ячейка пуста
      const targetPositioned = this.getCharacterAt(index);
      if (targetPositioned !== null) {
        GamePlay.showError('Ячейка занята');
        return;
      }       

      // Находим персонажа для перемещения
      let positionedToMove = null;
      for (const positioned of this.allCharacters) {
        if (positioned.position === this.selectedIndex) {
          positionedToMove = positioned;
          break;
        }
      }

      if (!positionedToMove) {
        GamePlay.showError('Ошибка: персонаж не найден');
        return;
      }

      // Обновить позицию но выбранную
      positionedToMove.position = index;
      this.occupiedPositions.delete(this.selectedIndex);
      this.occupiedPositions.add(index);

      // Обновление отображения
      this.gamePlay.redrawPositions(this.allCharacters);

      // Снимаем выделения (только если они есть)
      if (this.selectedIndex !== null) {
        this.gamePlay.deselectCell(this.selectedIndex);
      }
      if (this.highlightedIndex !== null) {
        this.gamePlay.deselectCell(this.highlightedIndex);
      }
      
      // Сбрасываем состояния
      this.selectedIndex = null;
      this.selectedCharacter = null;
      this.highlightedIndex = null;
      this.highlightedColor = null;

      this.gamePlay.setCursor(cursors.auto);

      this.gameState.currentTurn = 'computer';
      // GamePlay.showMessage('Ход перешел к компьютеру');
      await this.delay(500); // Задержка 0.5 секунды
      // Ждем завершения хода компьютера
      await this.computerTurn();
      // После хода компьютера проверяем состояние игры
      await this.checkGameState();
      return;
    }  

    if (result.action === 'attack') {
      // Проверка, что персонаж выбран
      if (this.selectedIndex === null || this.selectedCharacter === null) {
        GamePlay.showError('Персонаж не выбран');
        return;
      }

      // Получаем данные атакующего
      const attackerPositioned = this.getCharacterAt(this.selectedIndex);
      if (!attackerPositioned) {
        GamePlay.showError('Ошибка: атакующий не найден');
        return;
      }
      const attacker = attackerPositioned.character;

      // Получаем данные цели
      const targetPositioned = this.getCharacterAt(index);
      if (!targetPositioned) {
        GamePlay.showError('Ошибка: цель не найдена');
        return;
      }
      const target = targetPositioned.character;

      // Проверяем, что цель - враг
      if (!this.isEnemyCharacter(target)) {
        GamePlay.showError('Нельзя атаковать своего персонажа');
        return;
      }

      // Рассчитываем урон
      const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);
      const roundedDamage = Math.round(Math.max(1, damage));

      // Уменьшаем здоровье цели
      target.health -= roundedDamage;
      if (target.health < 0) {
        target.health = 0;
      }

      // ПОКАЗЫВАЕМ АНИМАЦИЮ УРОНА (ждем завершения)
      await this.gamePlay.showDamage(index, roundedDamage);

      // ПРОВЕРКА СМЕРТИ
      if (target.health === 0) {
        // Удаляем персонажа из allCharacters
        const targetIndexArray = this.allCharacters.indexOf(targetPositioned);
        if (targetIndexArray !== -1) {
          this.allCharacters.splice(targetIndexArray, 1);
        }
        // Удаляем позицию из occupiedPositions
        this.occupiedPositions.delete(index);
      }

      // ОБНОВЛЯЕМ ОТОБРАЖЕНИЕ (пересчет полосок здоровья)
      this.gamePlay.redrawPositions(this.allCharacters);

      // СНИМАЕМ ВЫДЕЛЕНИЯ
      if (this.selectedIndex !== null) {
        this.gamePlay.deselectCell(this.selectedIndex);
      }
      if (this.highlightedIndex !== null) {
        this.gamePlay.deselectCell(this.highlightedIndex);
      }

      // СБРАСЫВАЕМ СОСТОЯНИЯ
      this.selectedIndex = null;
      this.selectedCharacter = null;
      this.highlightedIndex = null;
      this.highlightedColor = null;

      this.gamePlay.setCursor(cursors.auto);
      this.gameState.currentTurn = 'computer';

      await this.delay(500); // Задержка 0.5 секунды
      // Ждем завершения хода компьютера
      await this.computerTurn();

      // После хода компьютера проверяем состояние игры
      await this.checkGameState();
      return;
    } 

    if (result.action === 'invalid') {
      GamePlay.showError(result.reason);
    }
  };  


  onCellEnter(index) {
    const info = this.getCharacterInfo(index);    
    if(info) {
      this.gamePlay.showCellTooltip(info, index);
    } 

    // Если персонаж не выбран, ничего не делаем
    if (this.selectedIndex === null) {
      return;
    }

    // Снимаем старую подсветку
    if (this.highlightedIndex !== null) {
      this.gamePlay.deselectCell(this.highlightedIndex);
      this.highlightedIndex = null;
      this.highlightedColor = null;
    }

    const result = this.determineAction(index);
    this.highlightedIndex = index;

    switch (result.action) {
    case 'select':
      this.gamePlay.setCursor(cursors.pointer);
      // Подсветка не нужна
      break;

    case 'move':
      this.highlightedColor = 'green';
      this.gamePlay.selectCell(index, this.highlightedColor);
      this.gamePlay.setCursor(cursors.pointer); 
      break;

    case 'attack':
      this.highlightedColor = 'red';
      this.gamePlay.selectCell(index, this.highlightedColor);
      this.gamePlay.setCursor(cursors.crosshair);
      break;

    case 'invalid':
    default:
      this.gamePlay.setCursor(cursors.notallowed);
      break;
    }    
  };


  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);

    if (this.highlightedIndex !== null) {
      this.gamePlay.deselectCell(this.highlightedIndex);
      this.highlightedIndex = null;
      this.highlightedColor = null;
    }
    if (this.selectedIndex !== null) {
      this.gamePlay.setCursor(cursors.pointer);
    } else  {
      this.gamePlay.setCursor(cursors.auto);
    }    
  }

  deselectCharacter() {
    if (this.selectedIndex !== null) {
      this.gamePlay.deselectCell(this.selectedIndex);
      this.selectedIndex = null;
      this.selectedCharacter = null;
    }
  }

  //---------------ответный ход компьютера---------------------------
  async computerTurn() {
    // Проверка, что ход компьютера
    if (this.gameState.currentTurn !== 'computer') {
      return;
    }

    // Очищаем все выделения
    if (this.selectedIndex !== null) {
      this.gamePlay.deselectCell(this.selectedIndex);
      this.selectedIndex = null;
      this.selectedCharacter = null;
    }
    if (this.highlightedIndex !== null) {
      this.gamePlay.deselectCell(this.highlightedIndex);
      this.highlightedIndex = null;
      this.highlightedColor = null;
    }
    this.gamePlay.setCursor(cursors.auto);

    // проверка на пустоту allCharacters
    if (this.allCharacters.length === 0) {
      this.gameState.currentTurn = 'gameover';
      return;
    }

    // Находим всех живых персонажей компьютера
    const computerCharacters = this.allCharacters.filter(positioned =>
      this.isEnemyCharacter(positioned.character) && 
      positioned.character.health > 0
    );

    // Если у компьютера нет живых персонажей → игрок победил!
    if (computerCharacters.length === 0) {
      // GamePlay.showMessage('🏆 Поздравляем! Вы победили!');
      await this.checkGameState();
      return;
    }

    // Находим всех живых персонажей игрока
    const playerCharacters = this.allCharacters.filter(positioned => 
      this.isPlayerCharacter(positioned.character) && positioned.character.health > 0
    );

    // Если у игрока нет живых персонажей → компьютер победил!
    if (playerCharacters.length === 0) {
      // GamePlay.showMessage('💀 Вы проиграли! Компьютер победил!');
      await this.checkGameState();
      return;
    }

    // Выбираем лучший ход для компьютера
    await this.executeComputerBestMove(computerCharacters, playerCharacters);

    // Проверяем состояние игры после хода компьютера
    await this.checkGameState();

    // Передаем ход игроку
    if (this.gameState.currentTurn !== 'gameover') {
      this.gameState.currentTurn = 'player';
      this.gamePlay.setCursor(cursors.auto);
    }      
  }

  // Метод выбора лучшего хода
  async executeComputerBestMove(computerCharacters, playerCharacters) {
    // Фильтруем только живых
    const aliveComputers = computerCharacters.filter(c => c.character.health > 0);
    const alivePlayers = playerCharacters.filter(c => c.character.health > 0);

    if (aliveComputers.length === 0 || alivePlayers.length === 0) {
      return;
    }

    // Найти всех врагов в радиусе атаки для каждого персонажа
    const availableAttacks = [];  // хранилище доступных атак
    for (const computerChar of computerCharacters) {
      const attacker = computerChar.character;
      const attackerPos = computerChar.position;

      for (const playerChar of playerCharacters) {
        const target = playerChar.character;
        const targetPos = playerChar.position;

        // Проверяем, может ли персонаж атаковать эту цель
        const attackRadius = this.getAttackRadius(attacker);
        const canAttack = this.isCellInRange(attackerPos, targetPos, attackRadius);

        if (canAttack) {
          availableAttacks.push({
            attacker: computerChar,
            target: playerChar,
            damage: this.calculateDamage(attacker, target),
            targetHealth: target.health
          });
        }
      }
    }

    // Если есть доступные атаки → атакуем
    if (availableAttacks.length > 0) {
      await this.executeBestAttack(availableAttacks);
      return;
    }

    // Если нет доступных атак → перемещаемся
    await this.executeBestMove(computerCharacters, playerCharacters);
  }

  // Выбор лучшей цели для атаки
  async executeBestAttack(availableAttacks) {
    // Сортируем атаки по приоритету:
    // 1. Сначала добиваем тех, у кого здоровье <= 20% (добивание)
    // 2. Потом атакуем самого слабого
    // 3. Потом атакуем того, кто наносит больше урона

    // Фильтруем цели с низким здоровьем
    const lowHealthTargets = availableAttacks.filter(a => 
      a.target.character.health <= a.target.character.level * 10
    );

    let bestAttack;

    if (lowHealthTargets.length > 0) {
      //  Добиваем самого слабого среди почти убитых
      bestAttack = lowHealthTargets.reduce((best, current) => 
        current.target.character.health < best.target.character.health ? current : best
      );      
    } else {
      // Ищем атаку с максимальным уроном
      bestAttack = availableAttacks.reduce((best, current) => 
        current.damage > best.damage ? current : best
      );
    }

    // Выполняем атаку
    await this.performComputerAttack(
      bestAttack.attacker,
      bestAttack.target
    );
  }

  // Метод для перемещения игрока компьютера
  async executeBestMove(computerCharacters, playerCharacters) {
    // Находим ближайшего врага для каждого персонажа
    let bestMove = null;
    let minDistance = Infinity;
    let selectedComputerChar = null;
    let targetPosition = null;

    for (const computerChar of computerCharacters) {
      const attacerPos = computerChar.position;

      for (const playerChar of playerCharacters) {
        const targetPos = playerChar.position;

        // Находим ближайшую клетку к цели, куда может переместиться компьютер
        const possibleMoves = this.getPossibleMoves(computerChar, targetPos);

        if (possibleMoves.length > 0) {
          // Выбираем самую близкую клетку к цели
          const closestMove = possibleMoves.reduce((best, current) => {
            const dist1 = this.getDistance(current, targetPos);
            const dist2 = this.getDistance(best, targetPos);
            return dist1 < dist2 ? current : best;
          });

          const distance = this.getDistance(closestMove, targetPos);

          if (distance < minDistance) {
            minDistance = distance;
            selectedComputerChar = computerChar;
            targetPosition = closestMove;
          }
        }
      }
    }

    // Если есть куда переместиться → перемещаемся
    if (selectedComputerChar && targetPosition !== null) {
      await this.performComputerMove(selectedComputerChar, targetPosition);
    } else {
      // Если переместиться некуда → пропускаем ход
      GamePlay.showMessage('Компьютер пропускает ход');
    }
  }

  // Расчет урона
  calculateDamage(attacker, target) {
    const damage = Math.max(
      attacker.attack - target.defence,
      attacker.attack * 0.1
    );
    return Math.round(Math.max(1, damage));
  }

  // Получение расстояния между клетками
  getDistance(pos1, pos2) {
    const boardSize = this.gamePlay.boardSize;
    const row1 = Math.floor(pos1 / boardSize);
    const col1 = pos1 % boardSize;
    const row2 = Math.floor(pos2 / boardSize);
    const col2 = pos2 % boardSize;
    return Math.max(Math.abs(row1 - row2), Math.abs(col1 - col2));
  }

  // Получение возможных клеток для перемещения
  getPossibleMoves(computerChar, targetpos) {
    const attacker = computerChar.character;
    const attacerPos = computerChar.position;
    const moveRadius = this.getMoveRadius(attacker);
    const possibleMoves = [];

    const boardSize = this.gamePlay.boardSize;
    for (let i = 0; i < boardSize ** 2 ; i++) {
      // Проверяем, может ли персонаж переместиться на эту клетку
      const canMove = this.isCellInRange(attacerPos, i, moveRadius);
      const isOccupied = this.getCharacterAt(i) !== null;

      // Клетка должна быть в радиусе и свободна
      if (canMove && !isOccupied) {
        possibleMoves.push(i);
      }
    }
    return possibleMoves;
  }

  async checkGameState() {
    // Находим всех живых персонажей игрока
    const playerCharacters = this.allCharacters.filter(positioned => 
      this.isPlayerCharacter(positioned.character) &&
      positioned.character.health > 0
    );

    // Находим всех живых персонажей компьютера
    const computerCharacters = this.allCharacters.filter(positioned => 
      this.isEnemyCharacter(positioned.character) &&
      positioned.character.health > 0
    );

    // Если у игрока нет живых персонажей
    if (playerCharacters.length === 0) {
      GamePlay.showError('💀 Вы проиграли! Компьютер победил!');
      this.gameState.currentTurn = 'gameover';
      this.gamePlay.setCursor(cursors.auto);
      this.gamePlay.boardEl.style.pointerEvents = 'none'; // Блокируем
      this.saveGame();
      return 'computer_wins';
    }
    
    // Если у компьютера нет живых персонажей
    if (computerCharacters.length === 0) {
      // Проверяем, не последний ли это уровень
      if (this.gameState.level >= 4) {
        // Все уровни пройдены → победа в игре!
        GamePlay.showMessage('🏆 Поздравляем! Вы прошли всю игру!');
        this.gameState.currentTurn = 'gameover';
        this.gamePlay.setCursor(cursors.auto);
        this.gamePlay.boardEl.style.pointerEvents = 'none'; // Блокируем
        this.saveGame();
        return 'game_won';
      } else {
        // Переходим на следующий уровень
        await this.nextLevel();
        return 'level_complete';
      }
    }

    return 'continue';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Выполнение атаки компьютера
  async performComputerAttack(attackerPositioned, targetPositioned) {
    const attacker = attackerPositioned.character;
    const target = targetPositioned.character;
    const targetIndex = targetPositioned.position;

    // Рассчитываем урон
    const damage = this.calculateDamage(attacker, target);

    // Уменьшаем здоровье цели
    target.health -= damage;
    if (target.health < 0) {
      target.health = 0;
    }

    target.health = Math.round(target.health);

    // Показываем анимацию урона
    await this.gamePlay.showDamage(targetIndex, damage);

    // Проверяем смерть
    if (target.health === 0) {
      const targetIndexInArray = this.allCharacters.indexOf(targetPositioned);
      if (targetIndexInArray !== -1) {
        this.allCharacters.splice(targetIndexInArray, 1);
      }
      this.occupiedPositions.delete(targetIndex);
    }

    // Обновляем отображение
    this.gamePlay.redrawPositions(this.allCharacters);
  }


  // Выполнение перемещения игрока компьютера
  async performComputerMove(computerChar, targetPosition) {
    // Обновляем позицию персонажа
    const oldPosition = computerChar.position;
    computerChar.position = targetPosition;

    // Обновляем occupiedPositions
    this.occupiedPositions.delete(oldPosition);
    this.occupiedPositions.add(targetPosition);

    // Обновляем отображение
    this.gamePlay.redrawPositions(this.allCharacters);

    GamePlay.showMessage(`Компьютер переместился на позицию ${targetPosition}`);
  }

  //-------------------------------------------------------------

  async nextLevel() {
    // Повышаем уровень всех живых персонажей игрока
    for (const positioned of this.allCharacters) {
      if (this.isPlayerCharacter(positioned.character)) {
        this. levelUpCharacter(positioned.character);
      }
    }

    // Увеличиваем номер уровня
    this.gameState.level += 1;
    this.gameState.score += 100;    // Бонус за прохождение уровня

    // Генерируем новых врагов
    this.generateEnemies();

    // Меняем тему
    const themeKeys = Object.keys(themes);
    const themeIndex = (this.gameState.level - 1) % themeKeys.length;
    const newTheme = themes[themeKeys[themeIndex]];
    this.gamePlay.drawUi(newTheme);
    this.gameState.theme = newTheme;  // Сохраняем тему в состоянии

    // Перерисовываем персонажей
    this.gamePlay.redrawPositions(this.allCharacters);

    // Передаем ход игроку
    this.gameState.currentTurn = 'player';
    this.gamePlay.setCursor(cursors.auto);

    // Сохраняем состояние
    this.saveGame();
  }

  levelUpCharacter(character) {
    // Рассчитываем процент оставшегося здоровья
    const healthPercent = character.health;

    // Новое здоровье
    const newHealth = Math.min(character.level + 80, 100);

    // Новые характеристики
    const newAttack = Math.max(character.attack, Math.round(character.attack * (80 + healthPercent) / 100));
    const newDefence = Math.max(character.defence, Math.round(character.defence * (80 + healthPercent) / 100));

    // Повышаем уровень
    character.level += 1;
    character.health = Math.round(newHealth);
    character.attack = newAttack;
    character.defence = newDefence;
  }


  onNewGame() {
    // Спрашиваем подтверждение
    if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
      this.startNewGame();
    }
  }

  onSaveGame() {
    this.saveGame();
    GamePlay.showMessage('Игра сохранена!');
  }

  onLoadGame() {
    try {
      const savedState = this.stateService.load();
      if (savedState) {
        this.gameState = GameState.from(savedState);
        this.restoreCharacters(savedState.characters);
        this.gamePlay.drawUi(this.gameState.theme);
        this.gamePlay.redrawPositions(this.allCharacters);
        GamePlay.showMessage('Игра загружена!');

        if (this.gameState.currentTurn === 'computer') {
          this.computerTurn();
        }
      }
    } catch (e) {
      GamePlay.showError('Не удалось загрузить игру');
    }
  }

  saveGame() {
    // Создаем объект состояния
    const state = this.gameState.toJSON(this.allCharacters, this.occupiedPositions);
    // Сохраняем через сервис
    this.stateService.save(state);
  }

  // Автосохранение после каждого хода
  async afterAction() {
    this.saveGame();
  }

  startNewGame() {
    // Сохраняем максимальный счет
    if (this.gameState && this.gameState.score > this.gameState.maxScore) {
      this.gameState.maxScore = this.gameState.score;
    }

    // Создаем новое состояние
    this.gameState = new GameState();
    this.gameState.maxScore = this.getMaxScore(); // Восстанавливаем из localStorage

    // Сбрасываем все состояния
    this.selectedIndex = null;
    this.selectedCharacter = null;
    this.highlightedIndex = null;
    this.highlightedColor = null;
    this.allCharacters = [];
    this.occupiedPositions = new Set();

    // Генерируем начальные позиции
    const playerTypes = [Bowman, Swordsman, Magician];
    const enemyTypes = [Daemon, Vampire, Undead];

    this.playerTeam = generateTeam(playerTypes, 3, 4);
    this.enemyTeam = generateTeam(enemyTypes, 3, 4);

    this.generatePositions(this.playerTeam, true);
    this.generatePositions(this.enemyTeam, false);

    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.redrawPositions(this.allCharacters);
    this.gamePlay.boardEl.style.pointerEvents = 'auto';
    this.gamePlay.setCursor(cursors.auto);

    this.gameState.currentTurn = 'player';

    this.saveGame();
  }

  // Проверка окончания уровня
  checkLevelComplete() {
    // Проверяем, есть ли живые враги
    const aliveEnemies = this.allCharacters.filter(p => 
      this.isEnemyCharacter(p.character) && p.character.health > 0
    );

    // Если врагов нет → уровень пройден
    if (aliveEnemies.length === 0) {
      return true;
    }
    return false;
  }

  // восстановление персонажей из сохранения
  restoreCharacters(savedCharacters) {
    this.allCharacters = [];
    this.occupiedPositions = new Set();

    const classMap = {
      'Bowman': Bowman,
      'Swordsman': Swordsman,
      'Magician': Magician,
      'Daemon': Daemon,
      'Vampire': Vampire,
      'Undead': Undead
    };

    for (const data of savedCharacters) {
      const characterClass = classMap[data.type];
      if (characterClass) {
        const character = new characterClass(data.level);
        character.health = data.health;
        character.attack = data.attack;
        character.defence = data.defence;

        const positioned =  new PositionedCharacter(character, data.position);
        this.allCharacters.push(positioned);
        this.occupiedPositions.add(data.position);
      }
    }
  }

  lockGame() {
    this.gameState.currentTurn = 'gameover';
    this.gamePlay.setCursor(cursors.auto);
    this.gamePlay.boardEl.style.pointerEvents = 'none';
  }

  unlockGame() {
    this.gameState.currentTurn = 'player';
    this.gamePlay.boardEl.style.pointerEvents = 'auto';
  }

  getMaxScore() {
    // Получаем максимальный счет из localStorage через stateService
    try {
      const savedState = this.stateService.load();
      if (savedState && savedState.maxScore) {
        return savedState.maxScore;
      }
    } catch (e) {
      // Игнорируем
    }
    return 0;
  }
}

