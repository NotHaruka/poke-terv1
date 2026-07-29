import { MonsterStats } from '../../pokemonData/models/PokemonInstance.js';

export class EVSystem {
  static createEmptyEVs(): MonsterStats {
    return { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  }

  static validateEVs(evs: MonsterStats): boolean {
    const total = evs.hp + evs.attack + evs.defense + evs.spAttack + evs.spDefense + evs.speed;
    if (total > 510) return false;
    for (const stat of Object.values(evs)) {
      if (stat < 0 || stat > 252) return false;
    }
    return true;
  }
}
