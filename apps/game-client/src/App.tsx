import { useState } from 'react';
import { MultiplayerCanvas } from '../ui/MultiplayerCanvas.js';
import { TileAtlasViewer } from '../../../tools/world-editor/TileAtlasViewer.js';
import { ChunkInspector } from '../../../tools/world-editor/ChunkInspector.js';
import { BiomeEditor } from '../../../tools/world-editor/BiomeEditor.js';
import { PipelineTool } from '../../../tools/world-editor/PipelineTool.js';

/**
 * src/App.tsx
 *
 * Minimal app shell: a tab switcher between the actual game view (MultiplayerCanvas) and the
 * dev tools built alongside worldgen (TileAtlasViewer / ChunkInspector / BiomeEditor /
 * PipelineTool). BattleInterface isn't wired in here yet since it needs a live battle state
 * source (client-side WebSocket connection to server/multiplayer.ts) that doesn't exist yet —
 * see its own file header for what's needed.
 */
type Tab = 'play' | 'tiles' | 'chunks' | 'biomes' | 'pipeline';

const TABS: { id: Tab; label: string }[] = [
  { id: 'play', label: 'Play' },
  { id: 'tiles', label: 'Tile Atlas' },
  { id: 'chunks', label: 'Chunk Inspector' },
  { id: 'biomes', label: 'Biome Editor' },
  { id: 'pipeline', label: 'Pipeline' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('play');

  const isDevMode = (import.meta as any).env?.DEV || (typeof window !== 'undefined' && window.location.search.includes('dev=true'));
  const visibleTabs = isDevMode ? TABS : TABS.filter(t => t.id === 'play');

  return (
    <div className="min-h-screen bg-black p-6 text-neutral-100">
      {visibleTabs.length > 1 && (
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">poke-ter</h1>
          <nav className="flex gap-1">
            {visibleTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded px-3 py-1.5 text-sm ${
                  tab === t.id ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>
      )}

      <main>
        {tab === 'play' && <MultiplayerCanvas />}
        {tab === 'tiles' && <TileAtlasViewer />}
        {tab === 'chunks' && <ChunkInspector />}
        {tab === 'biomes' && <BiomeEditor />}
        {tab === 'pipeline' && <PipelineTool />}
      </main>
    </div>
  );
}
