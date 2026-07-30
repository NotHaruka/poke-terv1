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
    sourceIndex: 13,
    metatileId: 13,
    walkable: true,
    blocksMovement: false,
    encounterType: 'grass',
    encounterTable: 'plains_wild',
    verified: true,
    notes: 'METATILE_General_TallGrass (0x00D) from pret/pokeemerald metatile_labels.h — authoritative, not color-guessed',
    tags: ['verified', 'authoritative', 'encounter'],
  },
  {
    id: 'water_open',
    name: 'Water Open',
    category: 'water',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 368,
    metatileId: 368,
    walkable: false,
    blocksMovement: true,
    encounterType: 'water',
    animated: true,
    verified: true,
    notes: 'METATILE_General_CalmWater (0x170) from pret/pokeemerald metatile_labels.h — authoritative, not color-guessed',
    tags: ['verified', 'authoritative'],
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
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 14,
    metatileId: 14,
    walkable: false,
    blocksMovement: true,
    verified: true,
    notes: 'METATILE_General_Grass_TreeUp (0x00E) — the real standalone overworld tree object, shared by every outdoor map. Previous pick (fortree secondary #520) was a decorative shrub from Fortree\'s town-specific tiles, not a real tree object.',
    tags: ['verified', 'authoritative'],
  },
  {
    id: 'cave_wall_brown',
    name: 'Rock Wall',
    category: 'mountain',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 121,
    metatileId: 121,
    walkable: false,
    blocksMovement: true,
    verified: true,
    notes: 'METATILE_General_RockWall_GrassBase (0x079) — real overworld rock/mountain wall object. Previous pick was from the cave secondary tileset, appropriate for cave interiors but not overworld mountains.',
    tags: ['verified', 'authoritative'],
  },
  {
    id: 'building_facade',
    name: 'Building Wall',
    category: 'building',
    atlasKey: 'assets/tilesets/towns/emerald_petalburg.png',
    atlas: 'assets/tilesets/towns/emerald_petalburg.png',
    sourceIndex: 545,
    metatileId: 545,
    walkable: false,
    blocksMovement: true,
    verified: false,
    notes: 'Previous pick (#512) was a hard bug: 100% transparent, confirmed via pixel scan, rendered as nothing. #545 is confirmed non-blank (a wall/window panel from the real Petalburg secondary) but has no named constant in pret/pokeemerald to confirm it\'s the exact intended wall tile — real Gen3 buildings are multi-tile structures (roof row + wall rows + door), not a single 16x16 tile, so any single "building" tile is inherently an approximation. Worth a real in-game visual check.',
    tags: ['unverified', 'non-blank-confirmed'],
  },
  {
    id: 'door_entrance',
    name: 'Door Entrance',
    category: 'door',
    atlasKey: 'assets/tilesets/towns/emerald_petalburg.png',
    atlas: 'assets/tilesets/towns/emerald_petalburg.png',
    sourceIndex: 584,
    metatileId: 584,
    walkable: true,
    blocksMovement: false,
    interactionType: 'door',
    verified: true,
    notes: 'METATILE_Petalburg_Door_Littleroot (0x248) — the actual door tile used for Littleroot Town\'s houses in real Emerald (this secondary tileset is shared between Littleroot and Petalburg). Previous pick (#515) was an unverified guess that rendered as a green foliage blob, not a door.',
    tags: ['verified', 'authoritative'],
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
    id: 'door_lab',
    name: 'Lab Door',
    category: 'door',
    atlasKey: 'assets/tilesets/towns/emerald_petalburg.png',
    atlas: 'assets/tilesets/towns/emerald_petalburg.png',
    sourceIndex: 585,
    metatileId: 585,
    walkable: true,
    blocksMovement: false,
    interactionType: 'door',
    verified: true,
    notes: 'METATILE_Petalburg_Door_BirchsLab (0x249) — the real door tile for Professor Birch\'s Lab in Littleroot Town, authoritative from pret/pokeemerald.',
    tags: ['verified', 'authoritative'],
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
    name: 'Sand',
    category: 'sand',
    atlasKey: 'assets/tilesets/general/emerald_general_petalburg.png',
    atlas: 'assets/tilesets/general/emerald_general_petalburg.png',
    sourceIndex: 289,
    metatileId: 289,
    walkable: true,
    blocksMovement: false,
    verified: true,
    notes: 'METATILE_General_SandPit_Center (0x121) — real sand tile. Previous pick (Fallarbor secondary #512) was a hard bug: that exact metatile is 100% transparent (confirmed via pixel scan), so it rendered as nothing at all.',
    tags: ['verified', 'authoritative'],
  },
  {
    id: 'snow_ground',
    name: 'Snow Ground',
    category: 'snow',
    atlasKey: 'assets/tilesets/towns/emerald_mossdeep.png',
    atlas: 'assets/tilesets/towns/emerald_mossdeep.png',
    sourceIndex: 513,
    metatileId: 513,
    walkable: true,
    blocksMovement: false,
    verified: false,
    notes: 'IMPORTANT: real Pokémon Emerald has no snow/ice town tileset at all (checked pret/pokeemerald\'s full secondary tileset list — nothing snow/ice-themed exists; Mossdeep is a tropical space-center island in canon, not snowy). The original "snow biome -> Mossdeep" mapping was invented, not real. #512 was also a hard bug (100% transparent); #513 is at least non-blank, but this whole biome has no authentic source tileset. Recommend dropping the snow biome entirely, or deliberately choosing a stylized substitute (e.g. Sootopolis\'s blue palette) rather than pretending this is authentic.',
    tags: ['unverified', 'non-blank-confirmed', 'no-authentic-source'],
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