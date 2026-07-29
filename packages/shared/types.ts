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
export type { Ability } from '../game-core/pokemonData/models/Ability.js';
export type { Item, ItemCategory } from '../game-core/pokemonData/models/Item.js';
export type { Move, MoveCategory, MoveTarget, MoveSecondaryEffect } from '../game-core/pokemonData/models/Move.js';
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
} from '../game-core/pokemonData/models/PokemonInstance.js';
export type { Trainer } from '../game-core/pokemonData/models/Trainer.js';
export type { PokemonSpecies, FormDefinition, StatBlock, EVYield, GrowthRate } from '../game-core/pokemonData/models/PokemonSpecies.js';
// NOTE: BattleState is intentionally not re-exported here. The old shared/ copy was an empty
// stub; the real implementation lives in server/battleResolution/BattleState.ts and is
// re-exported from server/battleResolution.ts. Import it from there if you need it server-side.

// --- New: procedural worldgen types ---

/** A single tile's identity within the tagged tile library. */
export interface TileDefinition {
  id: string;                 // stable string id, e.g. "grass_flat"
  name: string;               // human-readable tile name
  category: TileCategory;
  atlasKey: string;           // path to the source atlas PNG
  sourceIndex: number;        // index/metatileId into that atlas
  walkable: boolean;
  blocksMovement: boolean;
  encounterType?: string | null;     // e.g. "grass", "water", "cave"
  interactionType?: string | null;   // e.g. "door", "sign", "portal"
  movementCost?: number;             // default 1.0
  animated?: boolean;
  verified: boolean;
  notes?: string;
  tags: string[];             // free-form tags
  // Compatibility properties
  atlas: string;
  metatileId: number;
  encounterTable?: string;
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

// --- Map Data Models ---

export interface NPCPlacement {
  id: string;
  name: string;
  spriteType: 'professor' | 'healer' | 'villager';
  x: number; // in tiles
  y: number; // in tiles
  facing: 'up' | 'down' | 'left' | 'right';
  dialogue: string[];
}

export interface Transition {
  x: number; // in tiles
  y: number; // in tiles
  targetMapId: string;
  targetX: number; // target tile x
  targetY: number; // target tile y
  message?: string;
}

export interface EncounterZone {
  x: number; // in tiles
  y: number; // in tiles
  width: number; // in tiles
  height: number; // in tiles
  encounterType: string;
}

export interface MapData {
  id: string;
  name: string;
  width: number; // in tiles
  height: number; // in tiles
  layers: {
    base: string[][]; // tileId[][] - rows of columns
    overlay?: string[][]; // tileId[][] - optional top-layer
  };
  npcs: NPCPlacement[];
  spawnPoint: { x: number; y: number };
  encounterZones: EncounterZone[];
  transitions: Transition[];
}

