import { MonsterStats, Stat, Nature } from '../../pokemonData/models/PokemonInstance.js';
import { getNatureMultiplier } from '../../pokemonData/data/Natures.js';
import { StatBlock } from '../../pokemonData/models/PokemonSpecies.js';

export class StatCalculator {
  static calculateStats(
    baseStats: StatBlock,
    ivs: MonsterStats,
    evs: MonsterStats,
    level: number,
    nature: Nature
  ): MonsterStats {
    return {
      hp: this.calculateHP(baseStats.hp, ivs.hp, evs.hp, level),
      attack: this.calculateOtherStat(baseStats.attack, ivs.attack, evs.attack, level, getNatureMultiplier(nature, Stat.Attack)),
      defense: this.calculateOtherStat(baseStats.defense, ivs.defense, evs.defense, level, getNatureMultiplier(nature, Stat.Defense)),
      spAttack: this.calculateOtherStat(baseStats.specialAttack, ivs.spAttack, evs.spAttack, level, getNatureMultiplier(nature, Stat.SpAttack)),
      spDefense: this.calculateOtherStat(baseStats.specialDefense, ivs.spDefense, evs.spDefense, level, getNatureMultiplier(nature, Stat.SpDefense)),
      speed: this.calculateOtherStat(baseStats.speed, ivs.speed, evs.speed, level, getNatureMultiplier(nature, Stat.Speed)),
    };
  }

  private static calculateHP(base: number, iv: number, ev: number, level: number): number {
    if (base === 1) return 1; // Shedinja special case
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }

  private static calculateOtherStat(base: number, iv: number, ev: number, level: number, natureMult: number): number {
    const preNature = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
    return Math.floor(preNature * natureMult);
  }
}
