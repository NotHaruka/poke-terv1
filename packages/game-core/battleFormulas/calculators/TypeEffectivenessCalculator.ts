import { MonsterType } from '../../pokemonData.js';

export class TypeEffectivenessCalculator {
  // Assume pokemonRegistry.getTypeEffectiveness is used in actual implementation
  public static calculate(attackType: MonsterType, defenderTypes: [MonsterType, MonsterType | null]): number {
    // Placeholder implementation, should hook into TypeChart
    return 1.0;
  }
}