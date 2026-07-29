import { useState } from 'react';
import { TILE_LIBRARY } from '../../packages/world/tiles/tileLibrary.js';
import type { TileCategory, TileDefinition } from '../../packages/shared/types.js';

/**
 * client/ui/TileAtlasViewer.tsx
 *
 * Dev tool: browse every entry in worldgen/tiles/tileLibrary.ts, grouped by category, with a
 * cropped preview pulled directly from its source atlas. Existing 'verified' vs 'unverified' tags
 * (set when the tile library was built) are surfaced directly so it's obvious which tiles still
 * need an in-game visual check.
 */
const TILE_PX = 16;
const PREVIEW_SCALE = 4;

export function TileAtlasViewer() {
  const [filter, setFilter] = useState<TileCategory | 'all'>('all');
  const categories = Array.from(new Set(TILE_LIBRARY.map((t: TileDefinition) => t.category)));
  const visible = filter === 'all' ? TILE_LIBRARY : TILE_LIBRARY.filter((t: TileDefinition) => t.category === filter);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-neutral-200">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded px-3 py-1 text-xs ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}
        >
          all ({TILE_LIBRARY.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded px-3 py-1 text-xs ${filter === cat ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visible.map((tile: TileDefinition) => {
          const verified = tile.verified ?? tile.tags.includes('verified');
          const atlasPath = tile.atlasKey || tile.atlas || '';
          const sourceIdx = tile.sourceIndex ?? tile.metatileId ?? 0;
          return (
            <div key={tile.id} className="rounded border border-neutral-800 bg-neutral-900 p-2 text-xs">
              <div
                className="mx-auto overflow-hidden rounded"
                style={{
                  width: TILE_PX * PREVIEW_SCALE,
                  height: TILE_PX * PREVIEW_SCALE,
                  imageRendering: 'pixelated',
                  backgroundImage: `url(/${atlasPath})`,
                  backgroundPosition: `-${(sourceIdx % 16) * TILE_PX * PREVIEW_SCALE}px -${Math.floor(sourceIdx / 16) * TILE_PX * PREVIEW_SCALE}px`,
                  backgroundSize: `${16 * TILE_PX * PREVIEW_SCALE}px auto`,
                }}
              />
              <div className="mt-2 text-center text-xs font-semibold text-neutral-200">{tile.name || tile.id}</div>
              <div className="text-center text-[10px] text-neutral-500">id: {tile.id} · #{sourceIdx}</div>

              <div className="mt-2 space-y-1 text-[11px] border-t border-neutral-800 pt-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-500">walkable:</span>
                  <span className={tile.walkable ? 'text-emerald-400' : 'text-rose-400'}>{tile.walkable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">collision:</span>
                  <span className={tile.blocksMovement ? 'text-rose-400' : 'text-emerald-400'}>{tile.blocksMovement ? 'Blocked' : 'Passable'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">encounters:</span>
                  <span className="text-amber-300">{tile.encounterType || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">interaction:</span>
                  <span className="text-cyan-300">{tile.interactionType || 'None'}</span>
                </div>
              </div>

              <div className={`mt-2 text-center text-[10px] font-medium ${verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {verified ? '✓ verified' : '⚠ unverified'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
