import { GrowthRate } from '../../pokemonData/models/PokemonSpecies.js';
import { getExperienceForLevel } from '../../pokemonData/data/GrowthRates.js';

export class ExperienceCalculator {
  static getBaseExperienceForLevel(level: number, growthRate: GrowthRate): number {
    return getExperienceForLevel(level, growthRate);
  }

  static getExperienceForNextLevel(level: number, growthRate: GrowthRate): number {
    if (level >= 100) return 0;
    return getExperienceForLevel(level + 1, growthRate);
  }

  static getLevelForExperience(experience: number, growthRate: GrowthRate): number {
    for (let level = 100; level >= 1; level--) {
      if (experience >= getExperienceForLevel(level, growthRate)) {
        return level;
      }
    }
    return 1;
  }
}
