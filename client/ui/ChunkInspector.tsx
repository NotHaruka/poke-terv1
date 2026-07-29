import { useState } from 'react';
import { generateChunk } from '../../worldgen/generator/chunkGenerator.js';
import { getTile } from '../../worldgen/tiles/tileLibrary.js';
import type { Chunk } from '../../shared/types.js';

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
            {chunk.tiles.flatMap((row, y) =>
              row.map((placed, x) => {
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
            {hovered && chunk.tiles[hovered.y]?.[hovered.x] && (
              <div className="mt-3 rounded bg-neutral-900 p-2">
                <div className="text-neutral-500">hovered tile ({hovered.x}, {hovered.y})</div>
                <div>{chunk.tiles[hovered.y][hovered.x].tileId}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
