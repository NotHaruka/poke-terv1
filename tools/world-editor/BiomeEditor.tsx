import { Fragment, useState } from 'react';
import { BIOME_DEFINITIONS } from '../../packages/world/biomes/biomeDefinitions.js';
import type { BiomeDefinition, TileCategory } from '../../packages/shared/types.js';

/**
 * tools/world-editor/BiomeEditor.tsx
 *
 * Dev tool: inspect and live-tweak each biome's tile-category weights in memory.
 *
 * Changes made here are temporary and do NOT persist back to the source biome definitions.
 * Edit packages/world/src/biomes/biomeDefinitions.ts directly to permanently change values.
 *
 * This tool is intended for development use only.
 */

export function BiomeEditor() {
  const [biomes, setBiomes] = useState<BiomeDefinition[]>(() =>
    structuredClone(BIOME_DEFINITIONS)
  );

  const [selected, setSelected] = useState(biomes[0]?.id);

  const biome = biomes.find((b) => b.id === selected);

  const updateWeight = (category: TileCategory, value: number) => {
    setBiomes((prev) =>
      prev.map((b) =>
        b.id === selected
          ? {
              ...b,
              tileWeights: {
                ...b.tileWeights,
                [category]: value,
              },
            }
          : b
      )
    );
  };

  if (!biome) return null;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-neutral-200">
      <div className="mb-4 flex flex-wrap gap-2">
        {biomes.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelected(b.id)}
            className={`rounded px-3 py-1 text-xs ${
              b.id === selected
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-xs">
        <div className="col-span-2 mb-1 text-neutral-500">
          elevation [{biome.elevationRange.join(', ')}] · moisture [
          {biome.moistureRange.join(', ')}]
          {biome.encounterTableId && (
            <> · encounters: {biome.encounterTableId}</>
          )}
        </div>

        {(Object.entries(biome.tileWeights) as [TileCategory, number][]).map(
          ([category, weight]) => (
            <Fragment key={category}>
              <label className="flex items-center justify-between gap-2">
                {category}

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weight}
                  onChange={(e) =>
                    updateWeight(category, Number(e.target.value))
                  }
                  className="flex-1"
                />
              </label>

              <span className="w-10 text-right tabular-nums">
                {weight.toFixed(2)}
              </span>
            </Fragment>
          )
        )}
      </div>

      <p className="mt-4 text-[11px] text-neutral-500">
        Changes here are in-memory only. Edit{' '}
        <code className="text-neutral-400">
          packages/world/src/biomes/biomeDefinitions.ts
        </code>{' '}
        directly to persist them.
      </p>
    </div>
  );
}