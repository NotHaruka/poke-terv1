import { TILE_LIBRARY } from '../../worldgen/tiles/tileLibrary.js';

/**
 * client/ui/PipelineTool.tsx
 *
 * Dev tool: shows the current state of the asset pipeline (tile library coverage, which entries
 * are still unverified) and the commands to re-run it.
 *
 * Deliberately NOT wired to trigger assets-pipeline/run-pipeline.ts from a "Run" button in the
 * browser. That would mean exposing a server endpoint that executes child_process commands
 * (python3 + npx tsx) on request — a real security surface for something that's a local dev
 * workflow, not a runtime feature. Run it from a terminal instead:
 *   npx tsx assets-pipeline/run-pipeline.ts
 */
export function PipelineTool() {
  const verifiedCount = TILE_LIBRARY.filter(t => t.tags.includes('verified')).length;
  const unverified = TILE_LIBRARY.filter(t => !t.tags.includes('verified'));

  return (
    <div className="max-w-xl rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-neutral-200">
      <h3 className="mb-3 text-sm font-semibold">Asset Pipeline</h3>

      <div className="mb-4 flex gap-4 text-xs">
        <div className="rounded bg-neutral-900 px-3 py-2">
          <div className="text-2xl font-bold text-emerald-400">{verifiedCount}</div>
          <div className="text-neutral-500">verified tiles</div>
        </div>
        <div className="rounded bg-neutral-900 px-3 py-2">
          <div className="text-2xl font-bold text-amber-400">{unverified.length}</div>
          <div className="text-neutral-500">need visual check</div>
        </div>
        <div className="rounded bg-neutral-900 px-3 py-2">
          <div className="text-2xl font-bold">{TILE_LIBRARY.length}</div>
          <div className="text-neutral-500">total in library</div>
        </div>
      </div>

      {unverified.length > 0 && (
        <div className="mb-4">
          <div className="mb-1 text-xs text-neutral-500">unverified entries:</div>
          <ul className="space-y-0.5 text-xs">
            {unverified.map(t => (
              <li key={t.id} className="text-amber-300">{t.id} <span className="text-neutral-600">({t.atlas.split('/').pop()} #{t.metatileId})</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded bg-neutral-900 p-3 text-xs">
        <div className="mb-1 text-neutral-500">re-run the full pipeline:</div>
        <code className="text-emerald-300">npx tsx assets-pipeline/run-pipeline.ts</code>
        <div className="mt-2 text-neutral-500">requires:</div>
        <ul className="list-inside list-disc text-neutral-400">
          <li>python3 + <code>pip install pillow --break-system-packages</code></li>
          <li>a local clone of rh-hideout/pokeemerald-expansion</li>
        </ul>
      </div>
    </div>
  );
}
