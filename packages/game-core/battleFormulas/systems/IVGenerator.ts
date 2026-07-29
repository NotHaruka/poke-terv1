import { MonsterStats } from '../../pokemonData/models/PokemonInstance.js';

export class IVGenerator {
  static generate(): MonsterStats {
    return {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      spAttack: Math.floor(Math.random() * 32),
      spDefense: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32),
    };
  }

  static createMaxIVs(): MonsterStats {
    return { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 };
  }
}
