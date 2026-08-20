import themes from './themes.js';

export default class GameState {
  constructor() {
    this.currentTurn = 'player';    // 'player' | 'computer' | 'gameover'
    this.level = 1;                 // Текущий уровень (1-4)
    this.score = 0;                 // Очки за текущую игру
    this.maxScore = 0;              // Максимальное количество очков за все игры
    this.theme = themes.prairie;    // Текущая тема
    this.characters = [];           // Данные о всех персонажах
    this.occupiedPositions = [];    // Занятые позиции
  }

  // Метод для сохранения состояния в объект
  toJSON(characters, occupiedPositions) {
    return {
      currentTurn: this.currentTurn,
      level: this.level,
      score: this.score,
      maxScore: this.maxScore,
      theme: this.theme,
      characters: characters.map(p =>({
        type: p.character.constructor.name,
        level: p.character.level,
        health: p.character.health,
        attack: p.character.attack,
        defence: p.character.defence,
        position: p.position
      })),
      occupiedPosition: Array.from(this.occupiedPositions)
    };
  }
  
  // Метод для восстановления состояния из объекта
  static from(object) {
    const state = new GameState();
    state.currentTurn = object.currentTurn || 'player';
    state.level = object.level || 1;
    state.score = object.score || 0;
    state.maxScore = object.maxScore || 0;
    state.theme = object.theme || themes.prairie;
    state.characters = object.characters || [];
    state.occupiedPositions = new Set(object.occupiedPositions || []);    
    return state;
  }
}
