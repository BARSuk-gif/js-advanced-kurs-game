import Team from './Team.js';

/**
 * Формирует экземпляр персонажа из массива allowedTypes со
 * случайным уровнем от 1 до maxLevel
 *
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @returns генератор, который при каждом вызове
 * возвращает новый экземпляр класса персонажа
 *
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  for (;;) {
    const randomIndex = Math.floor(Math.random() * allowedTypes.length);
    const randomClass = allowedTypes[randomIndex];
    const randomLevel = Math.floor(Math.random() * maxLevel + 1);
    yield new randomClass(randomLevel);
  }  
}

/**
 * Формирует массив персонажей на основе characterGenerator
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @param characterCount количество персонажей, которое нужно сформировать
 * @returns экземпляр Team, хранящий экземпляры персонажей. Количество персонажей в команде - characterCount
 * */
export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const generator = characterGenerator(allowedTypes, maxLevel);
  const teamMembers = [];

  for (let count = 0; count < characterCount; count++) {
    const character = generator.next().value;
    teamMembers.push(character);
  }

  const team = new Team(teamMembers);

  return team;
}
