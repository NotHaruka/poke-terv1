import { MonsterInstance, StatusEffect } from '../../../shared/pokemonData.js';
import { pokemonRegistry } from '../../../shared/pokemonData.js';

export class CaptureCalculator {
  /**
   * Calculates the capture probability and returns the number of shakes.
   * If shakes === 4, the Pokemon is caught.
   */
  public static calculate(target: MonsterInstance, ballId: number): { shakes: number, caught: boolean } {
    const species = pokemonRegistry.getSpecies(target.speciesId);
    if (!species) {
      return { shakes: 0, caught: false };
    }

    const maxHp = target.stats.hp;
    const currentHp = target.currentHp;
    const catchRate = species.catchRate;

    // TODO: Pull these from an item registry later if we make items data-driven
    // Using standard ball IDs as placeholders: 1: Poke, 2: Great, 3: Ultra, 4: Master
    let ballBonus = 1.0;
    if (ballId === 2) ballBonus = 1.5;
    else if (ballId === 3) ballBonus = 2.0;
    else if (ballId === 4) {
      return { shakes: 4, caught: true }; // Master Ball
    }

    let statusBonus = 1.0;
    const targetStatus = (target as any).status;
    if (targetStatus === StatusEffect.Sleep || targetStatus === StatusEffect.Freeze) {
      statusBonus = 2.5;
    } else if (targetStatus && targetStatus !== StatusEffect.None) {
      statusBonus = 1.5;
    }

    // Formula: a = (((3 * MaxHP - 2 * CurrentHP) * CatchRate * BallBonus) / (3 * MaxHP)) * StatusBonus
    let a = (((3 * maxHp - 2 * currentHp) * catchRate * ballBonus) / (3 * maxHp)) * statusBonus;
    
    // Cap at 255
    if (a >= 255) {
      return { shakes: 4, caught: true };
    }

    // Shake probability: b = 65536 / (255 / a)^0.25
    // Instead of using Math.pow(x, 0.25), Math.sqrt(Math.sqrt(x)) is equivalent and faster
    const b = 65536 / Math.sqrt(Math.sqrt(255 / a));

    let shakes = 0;
    for (let i = 0; i < 4; i++) {
      const roll = Math.floor(Math.random() * 65536);
      if (roll >= b) {
        break; // Broke out
      }
      shakes++;
    }

    return {
      shakes,
      caught: shakes === 4
    };
  }
}