import type { TileDefinition, TileCategory } from '../../shared/types.js';
import { TILE_VOID, TILE_GRASS, TILE_PATH, TILE_WATER, TILE_MOUNTAIN, TILE_TREE,
         TILE_BUILDING_FLOOR, TILE_BUILDING_WALL, TILE_DOOR, TILE_TALL_GRASS, TILE_PORTAL
       } from '../generator/legacyProceduralWorldgen.js';

/**
 * worldgen/tiles/tileLibrary.ts
 *
 * The actual bridge between:
 *  - the lifted legacy generator's numeric TILE_* ids (grass/water/path/etc, used by
 *    generateChunkTiles in generator/legacyProceduralWorldgen.ts)
 *  - real, verified Pokémon Emerald tiles, decoded from rh-hideout/pokeemerald-expansion.
 *
 * IDs below are the same ones verified by color-sampling the real decoded atlases (see
 * TilesetMappingConfig.ts in the old project for the full verification notes) — not re-guessed.
 * Entries marked verified: false were best-effort picks there and still need an in-game visual
 * check before you rely on them.
 */

export const TILE_LIBRARY: TileDefinition[] = [
  {
    id: 'grass_flat',
    category: 'grass',
    atlas: 'client/public/assets/tilesets/general/emerald_general_petalburg.png',
    metatileId: 1,
    walkable: true,
    tags: ['verified'],
  },
  {
    id: 'tall_grass',
    category: 'tall_grass',
    atlas: 'client/public/assets/tilesets/general/emerald_general_petalburg.png',
    metatileId: 22,
    walkable: true,
    encounterTable: 'plains_wild',
    tags: ['verified', 'encounter'],
  },
  {
    id: 'water_open',
    category: 'water',
    atlas: 'client/public/assets/tilesets/general/emerald_general_petalburg.png',
    metatileId: 49,
    walkable: false,
    tags: ['verified'],
  },
  {
    id: 'path_dirt',
    category: 'path',
    atlas: 'client/public/assets/tilesets/general/emerald_general_petalburg.png',
    metatileId: 20,
    walkable: true,
    tags: ['verified'],
  },
  {
    id: 'tree_canopy',
    category: 'tree',
    atlas: 'client/public/assets/tilesets/forests/emerald_fortree.png',
    metatileId: 520,
    walkable: false,
    tags: ['verified'],
  },
  {
    id: 'cave_wall_brown',
    category: 'mountain',
    atlas: 'client/public/assets/tilesets/caves/emerald_cave.png',
    metatileId: 514,
    walkable: false,
    tags: ['verified', 'note:real-emerald-caves-are-brown-not-gray'],
  },
  {
    id: 'building_facade',
    category: 'building',
    atlas: 'client/public/assets/tilesets/towns/emerald_petalburg.png',
    metatileId: 512,
    walkable: false,
    tags: ['unverified'],
  },
  {
    id: 'door_entrance',
    category: 'door',
    atlas: 'client/public/assets/tilesets/towns/emerald_petalburg.png',
    metatileId: 515,
    walkable: true,
    tags: ['unverified'],
  },
  {
    id: 'sign_post',
    category: 'sign',
    atlas: 'client/public/assets/tilesets/towns/emerald_petalburg.png',
    metatileId: 516,
    walkable: false,
    tags: ['unverified'],
  },
  {
    id: 'bridge_wood',
    category: 'bridge',
    atlas: 'client/public/assets/tilesets/general/emerald_general_petalburg.png',
    metatileId: 20, // placeholder — reuses path_dirt's tile, see TilesetMappingConfig.ts note
    walkable: true,
    tags: ['unverified', 'placeholder'],
  },
  {
    id: 'sand_desert',
    category: 'sand',
    atlas: 'client/public/assets/tilesets/towns/emerald_fallarbor.png',
    metatileId: 512, // first metatile of the real Fallarbor secondary — NOT color-verified, check in-game
    walkable: true,
    tags: ['unverified'],
  },
  {
    id: 'snow_ground',
    category: 'snow',
    atlas: 'client/public/assets/tilesets/towns/emerald_mossdeep.png',
    metatileId: 512, // first metatile of the real Mossdeep secondary — NOT color-verified, check in-game
    walkable: true,
    tags: ['unverified'],
  },
];

export function getTile(id: string): TileDefinition | undefined {
  return TILE_LIBRARY.find(t => t.id === id);
}

export function getTilesByCategory(category: TileCategory): TileDefinition[] {
  return TILE_LIBRARY.filter(t => t.category === category);
}

/**
 * Maps a legacy numeric TILE_* id (from generateChunkTiles) to a TileDefinition id.
 * TILE_BUILDING_FLOOR/TILE_BUILDING_WALL both collapse to 'building_facade' for now — the old
 * generator distinguished them for collision purposes only; use `walkable` on the returned
 * definition rather than the legacy distinction going forward.
 */
export function legacyTileIdToDefinitionId(legacyId: number): string {
  switch (legacyId) {
    case TILE_GRASS: return 'grass_flat';
    case TILE_TALL_GRASS: return 'tall_grass';
    case TILE_WATER: return 'water_open';
    case TILE_PATH: return 'path_dirt';
    case TILE_TREE: return 'tree_canopy';
    case TILE_MOUNTAIN: return 'cave_wall_brown';
    case TILE_BUILDING_FLOOR: return 'building_facade';
    case TILE_BUILDING_WALL: return 'building_facade';
    case TILE_DOOR: return 'door_entrance';
    case TILE_PORTAL: return 'door_entrance';
    case TILE_VOID:
    default:
      return 'grass_flat'; // safe fallback rather than rendering nothing
  }
}
