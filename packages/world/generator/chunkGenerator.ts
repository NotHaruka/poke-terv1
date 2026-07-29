import type { Chunk, PlacedTile } from '../../shared/types.js';
import { CHUNK_SIZE } from '../../game-core/pokemonData/data/Constants.js';
import { generateChunkTiles, getBiomeAt } from './legacyProceduralWorldgen.js';
import { legacyTileIdToDefinitionId } from '../tiles/tileLibrary.js';

/**
 * worldgen/generator/chunkGenerator.ts
 *
 * Thin, clean wrapper around the lifted legacy generator (legacyProceduralWorldgen.ts).
 * generateChunkTiles() already does the real work (noise-driven elevation/moisture/temperature
 * -> biome -> tile placement, plus rivers/roads/towns) — this just converts its raw numeric
 * tile grid into the new tagged-tile Chunk format the client/pipeline expects, and resolves a
 * single representative biome id for the chunk via getBiomeAt at its center.
 *
 * mapId is the legacy generator's landmark/region key (see HeightGenerator.getBaseElevation for
 * the specific hardcoded route landmarks) — pass 'city' for the default open world, or a
 * specific route id if you want one of the existing hand-tuned landmark blends.
 */
export function generateChunk(cx: number, cy: number, seed: number, mapId: string = 'city'): Chunk {
  const legacyGrid = generateChunkTiles(cx, cy, seed, mapId);

  const tiles: PlacedTile[][] = legacyGrid.map(row =>
    row.map((legacyId): PlacedTile => ({
      tileId: legacyTileIdToDefinitionId(legacyId),
    }))
  );

  const centerGx = cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
  const centerGy = cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
  const biome = getBiomeAt(centerGx, centerGy, seed, mapId);

  return {
    coord: { cx, cy },
    size: CHUNK_SIZE,
    tiles,
    biomeId: biome.id,
    seed,
  };
}
