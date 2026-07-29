import { PokemonInstance, StatusEffect } from '../models/PokemonInstance.js';
import { pokemonRegistry } from '../PokemonRegistry.js';

export interface CreatePokemonParams {
  speciesId: number;
  level: number;
  shiny?: boolean;
  nickname?: string;
  ability?: string;
}

export class PokemonFactory {
  static create(params: CreatePokemonParams): PokemonInstance {
    const species = pokemonRegistry.getSpecies(params.speciesId);
    const id = `mon_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const ability = params.ability || species?.abilities.primary || 'Overgrow';
    const baseStats = species?.baseStats || { hp: 10, attack: 10, defense: 10, specialAttack: 10, specialDefense: 10, speed: 10 };
    const hp = baseStats.hp + params.level * 2;
    const stats = {
      hp,
      attack: baseStats.attack + params.level,
      defense: baseStats.defense + params.level,
      spAttack: (baseStats as any).spAttack ?? (baseStats as any).specialAttack ?? 10,
      spDefense: (baseStats as any).spDefense ?? (baseStats as any).specialDefense ?? 10,
      speed: baseStats.speed + params.level
    };

    return {
      id,
      speciesId: params.speciesId,
      level: params.level,
      experience: 0,
      nature: 0,
      ability,
      ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
      evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      stats,
      currentHp: hp,
      friendship: 70,
      moves: [{ moveId: 1, pp: 35, maxPp: 35 }],
      shiny: params.shiny ?? false,
      otId: '00000',
      otName: 'Wild',
      nickname: params.nickname,
      status: StatusEffect.None
    };
  }
}
