import { MonsterInstance } from '../../pokemonData.js';

export class AccuracyCalculator {
  public static calculate(attacker: MonsterInstance, defender: MonsterInstance, move: any): boolean {
    if (move.accuracy === null || move.accuracy === undefined || move.accuracy === 0) {
      // Moves like Swift never miss
      return true;
    }
    
    // Apply accuracy/evasion stages here
    const hitChance = move.accuracy; // * accuracyStageModifier / evasionStageModifier
    const roll = Math.random() * 100;
    
    return roll <= hitChance;
  }
}