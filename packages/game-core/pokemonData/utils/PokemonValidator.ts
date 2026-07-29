import { PokemonInstance } from '../models/PokemonInstance.js';
import { pokemonRegistry } from '../PokemonRegistry.js';
import { ExperienceCalculator } from '../../battleFormulas/systems/ExperienceCalculator.js';
import { StatCalculator } from '../../battleFormulas/systems/StatCalculator.js';

export class PokemonValidator {
  static validate(pokemon: PokemonInstance): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const species = pokemonRegistry.getSpecies(pokemon.speciesId);
    if (!species) {
      errors.push(`Invalid species ID: ${pokemon.speciesId}`);
      return { valid: false, errors };
    }

    if (pokemon.level < 1 || pokemon.level > 100) {
      errors.push(`Invalid level: ${pokemon.level}`);
    }

    const expectedExp = ExperienceCalculator.getBaseExperienceForLevel(pokemon.level, species.growthRate);
    const nextLevelExp = pokemon.level < 100 ? ExperienceCalculator.getBaseExperienceForLevel(pokemon.level + 1, species.growthRate) : expectedExp;
    
    if (pokemon.experience < expectedExp || (pokemon.level < 100 && pokemon.experience >= nextLevelExp)) {
      errors.push(`Experience ${pokemon.experience} is invalid for level ${pokemon.level} with growth rate ${species.growthRate}`);
    }

    for (const [stat, iv] of Object.entries(pokemon.ivs)) {
      if (iv < 0 || iv > 31) errors.push(`Invalid IV for ${stat}: ${iv}`);
    }

    let totalEVs = 0;
    for (const [stat, ev] of Object.entries(pokemon.evs)) {
      if (ev < 0 || ev > 252) errors.push(`Invalid EV for ${stat}: ${ev}`);
      totalEVs += ev;
    }
    if (totalEVs > 510) {
      errors.push(`Total EVs exceed 510: ${totalEVs}`);
    }

    if (pokemon.nature < 0 || pokemon.nature > 24) {
      errors.push(`Invalid Nature: ${pokemon.nature}`);
    }

    if (pokemon.moves.length === 0 || pokemon.moves.length > 4) {
      errors.push(`Invalid number of moves: ${pokemon.moves.length}`);
    }
    for (const move of pokemon.moves) {
      if (!pokemonRegistry.getMove(move.moveId)) {
        errors.push(`Invalid move ID: ${move.moveId}`);
      } else {
        const moveData = pokemonRegistry.getMove(move.moveId)!;
        if (move.pp < 0 || move.pp > moveData.pp * 1.6) { // allow PP up max
          errors.push(`Invalid PP for move ${move.moveId}: ${move.pp}`);
        }
      }
    }

    if (!pokemonRegistry.getAbility(pokemon.ability)) {
      errors.push(`Invalid ability: ${pokemon.ability}`);
    }

    const expectedStats = StatCalculator.calculateStats(
      species.baseStats,
      pokemon.ivs,
      pokemon.evs,
      pokemon.level,
      pokemon.nature
    );
    for (const stat of Object.keys(expectedStats) as Array<keyof typeof expectedStats>) {
      if (pokemon.stats[stat as keyof typeof expectedStats] !== expectedStats[stat as keyof typeof expectedStats]) {
        errors.push(`Stat mismatch for ${stat}. Expected ${expectedStats[stat as keyof typeof expectedStats]}, got ${pokemon.stats[stat as keyof typeof expectedStats]}`);
      }
    }

    if (pokemon.currentHp < 0 || pokemon.currentHp > pokemon.stats.hp) {
      errors.push(`Invalid current HP: ${pokemon.currentHp}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
