/**
 * shared/pokemonData.ts
 *
 * Single entry point for all Pokémon data lifted from the old poke-ter project.
 *
 * NOTE ON HOW THIS WAS ASSEMBLED: the original code was ~30 separate files (data/,
 * database/, models/, utils/, plus PokemonRegistry.ts) totaling ~3,700 lines with real
 * cross-file type dependencies (e.g. database/PokemonData.ts imports StatBlock from
 * models/PokemonSpecies.ts). Hand-flattening that into one literal file risks silently
 * breaking references or duplicating type declarations. Instead, the original files were
 * preserved verbatim under shared/pokemonData/ (same relative folder structure, so their
 * existing imports still resolve correctly), and this file just re-exports everything from
 * one place. Functionally identical to a single file for anything importing from here.
 *
 * shared/pokemonData/
 *   data/        - raw data tables (Species, Moves, Abilities, TypeChart, etc.)
 *   database/    - typed data-access layer over the raw tables
 *   models/      - core interfaces/types (Ability, Item, Move, PokemonInstance,
 *                  PokemonSpecies, Trainer — NOT BattleState, which now lives in
 *                  battleFormulas.ts since it's battle-specific)
 *   utils/       - PokemonConverter, PokemonValidator
 *   PokemonRegistry.ts - ties species/moves/abilities/items/etc. together
 */

// --- data/ ---
export * from './pokemonData/data/Abilities.js';
export * from './pokemonData/data/CaptureRates.js';
export * from './pokemonData/data/Constants.js';
export * from './pokemonData/data/EggGroups.js';
export * from './pokemonData/data/Evolutions.js';
export * from './pokemonData/data/Forms.js';
export * from './pokemonData/data/GrowthRates.js';
export * from './pokemonData/data/HeldItems.js';
export * from './pokemonData/data/Items.js';
export * from './pokemonData/data/Learnsets.js';
export * from './pokemonData/data/MegaEvolution.js';
export * from './pokemonData/data/Moves.js';
export * from './pokemonData/data/Natures.js';
export * from './pokemonData/data/SpawnRules.js';
export * from './pokemonData/data/Species.js';
export * from './pokemonData/data/Terrains.js';
export * from './pokemonData/data/TypeChart.js';
export * from './pokemonData/data/Types.js';
export * from './pokemonData/data/Weather.js';

// --- database/ ---
export * from './pokemonData/database/AbilityData.js';
export * from './pokemonData/database/Database.js';
export * from './pokemonData/database/EvolutionData.js';
export * from './pokemonData/database/FormData.js';
export * from './pokemonData/database/ItemData.js';
export * from './pokemonData/database/LearnsetData.js';
export * from './pokemonData/database/MoveData.js';
export * from './pokemonData/database/PokemonData.js';

// --- models/ ---
export * from './pokemonData/models/Ability.js';
export * from './pokemonData/models/Item.js';
export * from './pokemonData/models/Move.js';
export * from './pokemonData/models/PokemonInstance.js';
export * from './pokemonData/models/PokemonSpecies.js';
export * from './pokemonData/models/Trainer.js';

// --- utils/ ---
export * from './pokemonData/utils/PokemonConverter.js';
export * from './pokemonData/utils/PokemonValidator.js';

// --- registry ---
export * from './pokemonData/PokemonRegistry.js';

// --- managers/ + world/ (needed by capture system, genuinely core pokemon state) ---
export * from './pokemonData/managers/PokemonManager.js';
export * from './pokemonData/managers/PokemonFactory.js';
export * from './pokemonData/world/WildPokemon.js';

// --- math utilities ---
export * from './pokemonData/math.js';

// --- network protocol (packet types shared between client and server) ---
export * from './pokemonData/packets.js';

// --- Explicit re-exports to resolve export * ambiguities ---
export type { TypeInfo } from './pokemonData/data/Types.js';
export type { EvolutionRequirement } from './pokemonData/data/Evolutions.js';
export type { LearnsetMove } from './pokemonData/data/Learnsets.js';
export type { ItemData } from './pokemonData/database/ItemData.js';
export type { MoveData } from './pokemonData/database/MoveData.js';
export type { FormDefinition, StatBlock, EVYield } from './pokemonData/models/PokemonSpecies.js';

// --- Procedural worldgen helpers ---
export {
  findSafeSpawn,
  getBiomeAt,
  rawTerrainTile,
  generateChunkTiles,
  getGlobalTile,
  isWalkableTileId,
  TILE_WATER,
} from '../worldgen/generator/legacyProceduralWorldgen.js';
