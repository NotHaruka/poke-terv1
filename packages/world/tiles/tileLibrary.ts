import type { TileDefinition, TileCategory } from '@shared/types.js';
import {
  TILE_VOID, TILE_GRASS, TILE_PATH, TILE_WATER, TILE_MOUNTAIN, TILE_TREE,
  TILE_BUILDING_FLOOR, TILE_BUILDING_WALL, TILE_DOOR, TILE_TALL_GRASS, TILE_PORTAL
} from '../generator/legacyProceduralWorldgen.js';
import { TileRegistry } from './TileRegistry.js';

export const TILE_LIBRARY: TileDefinition[] = [
  {
    id: 'grass_flat',
    name: 'Grass Flat',
    category: 'grass',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 1,
    metatileId: 1,
    walkable: true,
    blocksMovement: false,
    verified: true,
    tags: ['verified'],
  },
  {
    id: 'tall_grass',
    name: 'Tall Grass',
    category: 'tall_grass',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 22,
    metatileId: 22,
    walkable: true,
    blocksMovement: false,
    encounterType: 'grass',
    encounterTable: 'plains_wild',
    verified: true,
    tags: ['verified', 'encounter'],
  },
  {
    id: 'water_open',
    name: 'Water Open',
    category: 'water',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 49,
    metatileId: 49,
    walkable: false,
    blocksMovement: true,
    encounterType: 'water',
    animated: true,
    verified: true,
    tags: ['verified'],
  },
  {
    id: 'path_dirt',
    name: 'Path Dirt',
    category: 'path',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 20,
    metatileId: 20,
    walkable: true,
    blocksMovement: false,
    verified: true,
    tags: ['verified'],
  },
  {
    id: 'tree_canopy',
    name: 'Tree Canopy',
    category: 'tree',
    atlasKey: 'assets/tilesets/forests/emerald_fortree.png',
    atlas: 'assets/tilesets/forests/emerald_fortree.png',
    sourceIndex: 520,
    metatileId: 520,
    walkable: false,
    blocksMovement: true,
    verified: true,
    tags: ['verified'],
  },
  {
    id: 'cave_wall_brown',
    name: 'Cave Wall Brown',
    category: 'mountain',
    atlasKey: 'assets/tilesets/caves/emerald_cave.png',
    atlas: 'assets/tilesets/caves/emerald_cave.png',
    sourceIndex: 514,
    metatileId: 514,
    walkable: false,
    blocksMovement: true,
    verified: true,
    notes: 'real emerald caves are brown, not gray',
    tags: ['verified', 'note:real-emerald-caves-are-brown-not-gray'],
  },
  {
    id: 'building_facade',
    name: 'Building Facade',
    category: 'building',
    atlasKey: 'assets/tilesets/towns/emerald_petalburg.png',
    atlas: 'assets/tilesets/towns/emerald_petalburg.png',
    sourceIndex: 512,
    metatileId: 512,
    walkable: false,
    blocksMovement: true,
    verified: false,
    tags: ['unverified'],
  },
  {
    id: 'door_entrance',
    name: 'Door Entrance',
    category: 'door',
    atlasKey: 'assets/tilesets/towns/emerald_petalburg.png',
    atlas: 'assets/tilesets/towns/emerald_petalburg.png',
    sourceIndex: 515,
    metatileId: 515,
    walkable: true,
    blocksMovement: false,
    interactionType: 'door',
    verified: false,
    tags: ['unverified'],
  },
  {
    id: 'sign_post',
    name: 'Sign Post',
    category: 'sign',
    atlasKey: 'assets/tilesets/towns/emerald_petalburg.png',
    atlas: 'assets/tilesets/towns/emerald_petalburg.png',
    sourceIndex: 516,
    metatileId: 516,
    walkable: false,
    blocksMovement: true,
    interactionType: 'sign',
    verified: false,
    tags: ['unverified'],
  },
  {
    id: 'bridge_wood',
    name: 'Bridge Wood',
    category: 'bridge',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 20,
    metatileId: 20,
    walkable: true,
    blocksMovement: false,
    verified: false,
    tags: ['unverified', 'placeholder'],
  },
  {
    id: 'sand_desert',
    name: 'Sand Desert',
    category: 'sand',
    atlasKey: 'assets/tilesets/towns/emerald_fallarbor.png',
    atlas: 'assets/tilesets/towns/emerald_fallarbor.png',
    sourceIndex: 512,
    metatileId: 512,
    walkable: true,
    blocksMovement: false,
    verified: false,
    tags: ['unverified'],
  },
  {
    id: 'snow_ground',
    name: 'Snow Ground',
    category: 'snow',
    atlasKey: 'assets/tilesets/towns/emerald_mossdeep.png',
    atlas: 'assets/tilesets/towns/emerald_mossdeep.png',
    sourceIndex: 512,
    metatileId: 512,
    walkable: true,
    blocksMovement: false,
    verified: false,
    tags: ['unverified'],
  },
];

// Initialize global tile registry with tile library
TileRegistry.getInstance().registerAll(TILE_LIBRARY);

export function getTile(id: string): TileDefinition | undefined {
  return TileRegistry.getInstance().get(id);
}

export function getTilesByCategory(category: TileCategory): TileDefinition[] {
  return TileRegistry.getInstance().getByCategory(category);
}

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
      return 'grass_flat';
  }
}
