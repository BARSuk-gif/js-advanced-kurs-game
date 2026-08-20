import Character from '../Character.js';

export class Daemon extends Character {
  constructor (level) {
    super(level);
    this.attack = 10;
    this. defence = 10;
    // this.type = 'Daemon';
  }    
}