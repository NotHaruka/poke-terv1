import { useState } from 'react';
import { generateChunk } from '../../packages/world/generator/chunkGenerator.js';
import { getTile } from '../../packages/world/tiles/tileLibrary.js';
import type { Chunk, PlacedTile } from '../../packages/shared/types.js';

/**
 * client/ui/ChunkInspector.tsx
 *
 * Dev tool: generate a specific chunk by coordinate/seed and inspect its tile grid + biome
 * without needing the full canvas renderer running. Useful for debugging worldgen output
 * directly (e.g. "why is chunk 4,-2 all water").
 */
export function ChunkInspector() {
  const [cx, setCx] = useState(0);
  const [cy, setCy] = useState(0);
  const [seed, setSeed] = useState(1);
  const [mapId, setMapId] = useState('city');
  const [chunk, setChunk] = useState<Chunk | null>(null);
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);

  const CATEGORY_COLORS: Record<string, string> = {
    grass: '#4a8f5c', tall_grass: '#2f6b3c', water: '#3a6fb0', path: '#c7a768',
    tree: '#1f4d2a', mountain: '#8a7360', sand: '#d9c48a', snow: '#e8eef2',
    building: '#a05a3a', door: '#5a3a20', sign: '#7a5a3a', bridge: '#b08050', decoration: '#909090',
  };

  const handleGenerate = () => {
    setChunk(generateChunk(cx, cy, seed, mapId));
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-neutral-200">
      <div className="mb-4 flex flex-wrap items-end gap-3 text-xs">
        <label className="flex flex-col gap-1">
          chunk X
          <input type="number" value={cx} onChange={e => setCx(Number(e.target.value))}
            className="w-20 rounded bg-neutral-800 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          chunk Y
          <input type="number" value={cy} onChange={e => setCy(Number(e.target.value))}
            className="w-20 rounded bg-neutral-800 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          seed
          <input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))}
            className="w-24 rounded bg-neutral-800 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          mapId
          <input type="text" value={mapId} onChange={e => setMapId(e.target.value)}
            className="w-28 rounded bg-neutral-800 px-2 py-1" />
        </label>
        <button onClick={handleGenerate} className="rounded bg-emerald-600 px-3 py-1.5 font-medium text-white">
          Generate
        </button>
      </div>

      {chunk && (
        <div className="flex flex-wrap gap-4">
          <div
            className="grid gap-px bg-neutral-800"
            style={{ gridTemplateColumns: `repeat(${chunk.size}, 10px)` }}
          >
            {chunk.tiles.flatMap((row: PlacedTile[], y: number) =>
              row.map((placed: PlacedTile, x: number) => {
                const def = getTile(placed.tileId);
                return (
                  <div
                    key={`${x},${y}`}
                    onMouseEnter={() => setHovered({ x, y })}
                    style={{ width: 10, height: 10, background: def ? CATEGORY_COLORS[def.category] : '#000' }}
                  />
                );
              })
            )}
          </div>

          <div className="min-w-[180px] text-xs">
            <div><span className="text-neutral-500">biome:</span> {chunk.biomeId}</div>
            <div><span className="text-neutral-500">size:</span> {chunk.size}×{chunk.size}</div>
            <div><span className="text-neutral-500">coord:</span> ({chunk.coord.cx}, {chunk.coord.cy})</div>
            {hovered && chunk.tiles[hovered.y]?.[hovered.x] && (() => {
              const tileId = chunk.tiles[hovered.y][hovered.x].tileId;
              const def = getTile(tileId);
              return (
                <div className="mt-3 rounded bg-neutral-900 p-2.5 text-xs space-y-1 border border-neutral-800">
                  <div className="text-neutral-500 font-medium">Hovered tile ({hovered.x}, {hovered.y})</div>
                  <div className="font-semibold text-emerald-300">{def?.name || tileId}</div>
                  <div className="text-[11px] text-neutral-400">ID: {tileId}</div>
                  {def && (
                    <div className="mt-2 space-y-1 text-[11px] pt-1 border-t border-neutral-800">
                      <div><span className="text-neutral-500">Walkability:</span> <span className={def.walkable ? 'text-emerald-400' : 'text-rose-400'}>{def.walkable ? 'Walkable' : 'Unwalkable'}</span></div>
                      <div><span className="text-neutral-500">Collision:</span> <span className={def.blocksMovement ? 'text-rose-400' : 'text-emerald-400'}>{def.blocksMovement ? 'Blocks Movement' : 'Passable'}</span></div>
                      <div><span className="text-neutral-500">Encounters:</span> <span className="text-amber-300">{def.encounterType || 'None'}</span></div>
                      <div><span className="text-neutral-500">Interaction:</span> <span className="text-cyan-300">{def.interactionType || 'None'}</span></div>
                      <div><span className="text-neutral-500">Status:</span> <span className={def.verified ? 'text-emerald-400' : 'text-amber-400'}>{def.verified ? '✓ Verified' : '⚠ Unverified'}</span></div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
