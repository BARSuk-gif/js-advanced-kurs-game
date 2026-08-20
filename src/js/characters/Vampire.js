import Character from '../Character.js';

export class Vampire extends Character {
  constructor (level) {
    super(level);
    this.attack = 25;
    this. defence = 25;
    // this.type = 'Vampire';
  }    
}