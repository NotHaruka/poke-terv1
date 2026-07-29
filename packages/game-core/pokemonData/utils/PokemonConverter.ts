import { PokemonInstance, MonsterInstance, MoveInstance, StatusEffect } from '../models/PokemonInstance.js';
import { pokemonRegistry } from '../PokemonRegistry.js';
import { ExperienceCalculator } from '../../battleFormulas/systems/ExperienceCalculator.js';

export interface MonsterToPokemonOptions {
  id?: string;
  otId?: string;
  otName?: string;
  shiny?: boolean;
  ability?: string;
}

export function monsterInstanceToPokemonInstance(
  mon: MonsterInstance | any,
  options?: MonsterToPokemonOptions
): PokemonInstance {
  // If it's already a full PokemonInstance with an ID and MoveInstance[] moves
  const existingId = options?.id || mon.id || `mon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Convert moves (number[] or MoveInstance[]) -> MoveInstance[]
  const moves: MoveInstance[] = [];
  if (Array.isArray(mon.moves)) {
    for (const m of mon.moves) {
      if (typeof m === 'number') {
        const moveData = pokemonRegistry.getMove(m);
        moves.push({
          moveId: m,
          pp: moveData?.pp ?? 35,
          maxPp: moveData?.pp ?? 35
        });
      } else if (m && typeof m === 'object' && 'moveId' in m) {
        moves.push({
          moveId: m.moveId,
          pp: m.pp ?? 35,
          maxPp: m.maxPp ?? 35
        });
      }
    }
  }

  // Determine Ability
  const species = pokemonRegistry.getSpecies(mon.speciesId);
  let ability = options?.ability || mon.ability;
  if (!ability && species) {
    ability = species.abilities.primary;
  }
  if (!ability) {
    ability = 'Overgrow';
  }

  // Determine Shiny
  const shiny = options?.shiny ?? mon.shiny ?? false;

  const level = Math.max(1, mon.level ?? 1);
  const exp = mon.experience ?? (species ? ExperienceCalculator.getBaseExperienceForLevel(level, species.growthRate) : 0);

  return {
    id: existingId,
    speciesId: mon.speciesId,
    level,
    experience: exp,
    nature: mon.nature ?? 0,
    ability,
    ivs: mon.ivs || { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    evs: mon.evs || { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    stats: mon.stats || { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
    currentHp: mon.currentHp ?? (mon.stats ? mon.stats.hp : 10),
    friendship: mon.friendship ?? 70,
    heldItemId: mon.heldItemId,
    moves,
    shiny,
    otId: options?.otId || mon.otId || '00000',
    otName: options?.otName || mon.otName || 'Wild',
    nickname: mon.nickname,
    status: mon.status ?? StatusEffect.None
  };
}

export function pokemonInstanceToMonsterInstance(pok: PokemonInstance | any): MonsterInstance {
  const moveIds = Array.isArray(pok.moves)
    ? pok.moves.map((m: any) => (typeof m === 'number' ? m : m.moveId))
    : [];

  const species = pokemonRegistry.getSpecies(pok.speciesId);
  const level = pok.level ?? 1;

  return {
    speciesId: pok.speciesId,
    nickname: pok.nickname,
    level,
    ivs: pok.ivs,
    evs: pok.evs,
    nature: pok.nature,
    currentHp: pok.currentHp,
    maxHp: pok.stats ? pok.stats.hp : 10,
    stats: pok.stats,
    moves: moveIds,
    status: pok.status ?? StatusEffect.None,
    friendship: pok.friendship ?? 70,
    experience: pok.experience ?? 0,
    experienceToNext: species ? ExperienceCalculator.getExperienceForNextLevel(level, species.growthRate) : 100
  };
}
