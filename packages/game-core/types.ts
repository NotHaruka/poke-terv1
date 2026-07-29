/**
 * shared/types.ts
 *
 * Two kinds of things live here:
 * 1. Genuinely new types for the procedural worldgen system — nothing like this existed in
 *    the old poke-ter project, since it used fixed hand-authored maps.
 * 2. Convenience re-exports of the core interfaces already declared in pokemonData.ts /
 *    battleFormulas.ts, so `import { Trainer, MonsterInstance } from '../shared/types'`
 *    works without duplicating any declarations (re-exported, not redefined).
 */

// --- Convenience re-exports (declared once in pokemonData/battleFormulas, not here) ---
export type { Ability } from './pokemonData/models/Ability.js';
export type { Item, ItemCategory } from './pokemonData/models/Item.js';
export type { Move, MoveCategory, MoveTarget, MoveSecondaryEffect } from './pokemonData/models/Move.js';
export type {
  Vec2,
  Direction,
  CardinalDirection,
  TileCoord,
  ChunkCoord,
  MonsterStats,
  MonsterSpecies,
  MonsterInstance,
  MoveData,
  PlayerProfile,
  PlayerData,
} from './pokemonData/models/PokemonInstance.js';
export type { Trainer } from './pokemonData/models/Trainer.js';
export type { PokemonSpecies, FormDefinition, StatBlock, EVYield, GrowthRate } from './pokemonData/models/PokemonSpecies.js';
// NOTE: BattleState is intentionally not re-exported here. The old shared/ copy was an empty
// stub; the real implementation lives in server/battleResolution/BattleState.ts and is
// re-exported from server/battleResolution.ts. Import it from there if you need it server-side.

// --- New: procedural worldgen types ---

/** A single tile's identity within the tagged tile library (worldgen/tiles/tileLibrary.ts). */
export interface TileDefinition {
  id: string;                 // stable string id, e.g. "grass_flat_01"
  category: TileCategory;
  atlas: string;               // path to the source atlas PNG
  metatileId: number;          // index into that atlas
  walkable: boolean;
  encounterTable?: string;     // optional: which wild-encounter table this tile triggers
  tags: string[];               // free-form tags for the generator's weighting rules (e.g. "edge", "water-adjacent")
}

export type TileCategory =
  | 'grass'
  | 'tall_grass'
  | 'water'
  | 'path'
  | 'tree'
  | 'mountain'
  | 'sand'
  | 'snow'
  | 'building'
  | 'door'
  | 'sign'
  | 'bridge'
  | 'decoration';

/** A biome's generation parameters — noise thresholds and which tiles it draws from. */
export interface BiomeDefinition {
  id: string;
  name: string;
  noiseScale: number;               // frequency of the noise sampled for this biome
  elevationRange: [number, number]; // [min, max] normalized elevation this biome occupies
  moistureRange: [number, number];  // [min, max] normalized moisture this biome occupies
  tileWeights: Partial<Record<TileCategory, number>>; // relative chance of each tile category
  encounterTableId?: string;
}

/** One generated chunk of the world (a fixed-size grid of placed tiles). */
export interface Chunk {
  coord: ChunkCoordLocal;
  size: number;                 // tiles per side, e.g. 16
  tiles: PlacedTile[][];        // [y][x]
  biomeId: string;
  seed: number;
}

// Local alias to avoid a circular import back into pokemonData for this one internal use.
export interface ChunkCoordLocal {
  cx: number;
  cy: number;
}

export interface PlacedTile {
  tileId: string;               // references TileDefinition.id
  variant?: number;             // for tiles with multiple visual variants
}

/** What the assets-pipeline hands off to worldgen/client: a decoded, tagged tile library. */
export interface PipelineOutput {
  generatedAt: string;
  tiles: TileDefinition[];
  atlases: { path: string; sourceRepo: string; sourceCommit?: string }[];
}
