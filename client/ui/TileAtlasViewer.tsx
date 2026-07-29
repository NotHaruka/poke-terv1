import { useState } from 'react';
import { TILE_LIBRARY } from '../../worldgen/tiles/tileLibrary.js';
import type { TileCategory } from '../../shared/types.js';

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
  const categories = Array.from(new Set(TILE_LIBRARY.map(t => t.category)));
  const visible = filter === 'all' ? TILE_LIBRARY : TILE_LIBRARY.filter(t => t.category === filter);

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
        {visible.map(tile => {
          const verified = tile.tags.includes('verified');
          return (
            <div key={tile.id} className="rounded border border-neutral-800 bg-neutral-900 p-2">
              <div
                className="mx-auto overflow-hidden rounded"
                style={{
                  width: TILE_PX * PREVIEW_SCALE,
                  height: TILE_PX * PREVIEW_SCALE,
                  imageRendering: 'pixelated',
                  backgroundImage: `url(/${tile.atlas})`,
                  backgroundPosition: `-${(tile.metatileId % 16) * TILE_PX * PREVIEW_SCALE}px -${Math.floor(tile.metatileId / 16) * TILE_PX * PREVIEW_SCALE}px`,
                  backgroundSize: `${16 * TILE_PX * PREVIEW_SCALE}px auto`,
                }}
              />
              <div className="mt-2 text-center text-xs font-medium">{tile.id}</div>
              <div className="text-center text-[10px] text-neutral-500">metatile {tile.metatileId}</div>
              <div className={`mt-1 text-center text-[10px] ${verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {verified ? '✓ verified' : '⚠ needs visual check'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
