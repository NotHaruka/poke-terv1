import type { BiomeDefinition } from '../../shared/types.js';

/**
 * worldgen/biomes/biomeDefinitions.ts
 *
 * Bridges the lifted legacy biome classification (generator/legacyProceduralWorldgen.ts ->
 * BiomeGenerator.determineBiome) to the new tagged tile system. The elevation/moisture/temp
 * ranges below mirror that function's actual thresholds:
 *   elevation < 0.33            -> lake
 *   elevation > 0.82            -> ice_peak
 *   temp < 0.12                 -> tundra
 *   moisture > 0.55             -> forest
 *   moisture < 0.24             -> desert
 *   otherwise                   -> plains
 *
 * tileWeights reference TileCategory (shared/types.ts), which the tile library
 * (worldgen/tiles/tileLibrary.ts) resolves to real decoded Pokémon Emerald tiles.
 */
export const BIOME_DEFINITIONS: BiomeDefinition[] = [
  {
    id: 'lake',
    name: 'Lake',
    noiseScale: 0.012,
    elevationRange: [0, 0.33],
    moistureRange: [0, 1],
    tileWeights: { water: 1 },
  },
  {
    id: 'ice_peak',
    name: 'Ice Peak',
    noiseScale: 0.012,
    elevationRange: [0.82, 1],
    moistureRange: [0, 1],
    tileWeights: { snow: 0.7, mountain: 0.3 },
  },
  {
    id: 'tundra',
    name: 'Tundra',
    noiseScale: 0.025,
    elevationRange: [0.33, 0.82],
    moistureRange: [0, 1],
    tileWeights: { snow: 0.6, grass: 0.3, mountain: 0.1 },
    encounterTableId: 'tundra_wild',
  },
  {
    id: 'forest',
    name: 'Forest',
    noiseScale: 0.04,
    elevationRange: [0.33, 0.82],
    moistureRange: [0.55, 1],
    tileWeights: { tree: 0.45, grass: 0.3, tall_grass: 0.25 },
    encounterTableId: 'forest_wild',
  },
  {
    id: 'desert',
    name: 'Desert',
    noiseScale: 0.04,
    elevationRange: [0.33, 0.82],
    moistureRange: [0, 0.24],
    tileWeights: { sand: 0.85, mountain: 0.15 },
    encounterTableId: 'desert_wild',
  },
  {
    id: 'plains',
    name: 'Plains',
    noiseScale: 0.04,
    elevationRange: [0.33, 0.82],
    moistureRange: [0.24, 0.55],
    tileWeights: { grass: 0.55, tall_grass: 0.25, path: 0.15, tree: 0.05 },
    encounterTableId: 'plains_wild',
  },
];

export function getBiomeDefinition(id: string): BiomeDefinition | undefined {
  return BIOME_DEFINITIONS.find(b => b.id === id);
}
