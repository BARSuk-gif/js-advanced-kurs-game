import Character from '../Character.js';
import Team from '../Team.js';
import { Bowman } from '../characters/Bowman.js';
import { Swordsman } from '../characters/Swordsman.js';
import { Magician } from '../characters/Magician.js';
import { Daemon } from '../characters/Daemon.js';
import { Vampire } from '../characters/Vampire.js';
import { Undead } from '../characters/Undead.js';
import { characterGenerator, generateTeam } from '../generators.js';


// 1. Напишите тесты на то, что исключение выбрасывается при создании объекта класса Character 
// и не выбрасывается при создании объектов унаследованных классов
describe('Character class', () => {
  test('should throw error if type character', () =>{
    expect(() => new Character(1)).toThrow('type cannot be Character');
  });

  test('should create child character with valid type', () => {
    const hero = new Daemon(2);
    const hero2 = new Swordsman(1);
    expect(hero.type).toBe('daemon');
    expect(hero2.type).toBe('swordsman');
  });
});

// 2. Проверьте, правильные ли характеристики содержат создаваемые персонажи 1-ого уровня
describe('Child classes', () => {
  test('should create bowman with correct stats', () => {
    const bowman = new Bowman(1);
    expect(bowman.level).toBe(1);
    expect(bowman.attack).toBe(25);
    expect(bowman.defence).toBe(25);
    expect(bowman.health).toBe(50);
  });

  test('should create swordsman with correct stats', () => {
    const swordsman = new Swordsman(1);
    expect(swordsman.level).toBe(1);
    expect(swordsman.attack).toBe(40);
    expect(swordsman.defence).toBe(10);
    expect(swordsman.health).toBe(50);
  });

  test('should create magician with correct stats', () => {
    const magician = new Magician(1);
    expect(magician.level).toBe(1);
    expect(magician.attack).toBe(10);
    expect(magician.defence).toBe(40);
    expect(magician.health).toBe(50);
  });

  test('should create vampire with correct stats', () => {
    const vampire = new Vampire(1);
    expect(vampire.level).toBe(1);
    expect(vampire.attack).toBe(25);
    expect(vampire.defence).toBe(25);
    expect(vampire.health).toBe(50);
  });

  test('should create undead with correct stats', () => {
    const undead = new Undead(1);
    expect(undead.level).toBe(1);
    expect(undead.attack).toBe(40);
    expect(undead.defence).toBe(10);
    expect(undead.health).toBe(50);
  });

  test('should create daemon with correct stats', () => {
    const daemon = new Daemon(1);
    expect(daemon.level).toBe(1);
    expect(daemon.attack).toBe(10);
    expect(daemon.defence).toBe(10);
    expect(daemon.health).toBe(50);
  });
});

// 3. Проверьте, выдаёт ли генератор characterGenerator бесконечно новые персонажи из 
// списка (учёт аргумента allowedTypes)
describe('functon characterGenerator', () => {
  test('should generator generate infinitely new characters from the list', () => {    
    const allowedTypes = [Bowman, Swordsman, Magician];
    const maxLevel = 3;
    const generator = characterGenerator(allowedTypes, maxLevel);
    for (let i = 0; i < 30; i++) {
      const result = generator.next();

      // Проверяем, что генератор бесконечный (done всегда false)
      expect(result.done).toBe(false);

      // Проверяем, что value — это персонаж
      const character = result.value;
      expect(character).toBeDefined();

      // Проверяем, что персонаж является экземпляром одного из разрешённых типов
      const isAllowedType = allowedTypes.some(type => character instanceof type);
      expect(isAllowedType).toBe(true);

      // Проверяем, что уровень персонажа в диапазоне от 1 до maxLevel
      expect(character.level).toBeGreaterThanOrEqual(1);
      expect(character.level).toBeLessThanOrEqual(maxLevel);
    }
  });
});

// 4. Проверьте, в нужном ли количестве и диапазоне уровней (учёт аргумента maxLevel) 
// создаются персонажи при вызове generateTeam
describe('function generateTeam', () => {
  test('should characters created in the right number and range of levels', () => {
    const playerTypes = [Bowman, Swordsman, Magician];
    const maxLevel = 3;
    const characterCount = 4;
    const team = generateTeam(playerTypes, maxLevel, characterCount);

    // Проверяем, что вернулся экземпляр Team
    expect(team).toBeInstanceOf(Team);

    // Получаем массив персонажей
    const characters = team.toArray();

    // Проверяем количество персонажей
    expect(characters).toHaveLength(characterCount);

    // Проверяем каждого персонажа
    for (const character of characters) {
      // Проверяем, что персонаж является экземпляром одного из разрешённых типов
      const isAllowedType = playerTypes.some(type => character instanceof type);
      expect(isAllowedType).toBe(true);

      // Проверяем, что уровень персонажа в диапазоне от 1 до maxLevel
      expect(character.level).toBeGreaterThanOrEqual(1);
      expect(character.level).toBeLessThanOrEqual(maxLevel);
    }
  });
});