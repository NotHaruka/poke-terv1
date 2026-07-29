# poke-ter Architecture Audit & Technical Blueprint

## Executive Summary
This document provides a comprehensive structural audit of the **poke-ter** codebase as of July 2026. The project is a full-stack, multiplayer, procedurally generated Pokémon-inspired RPG built with TypeScript, React 18, Vite, Express, and WebSockets (`ws`).

---

## 1. Inventory & Findings

### Runtime Entry Points
1. **Server Runtime Entry Point**: `server.ts`
   - Executed via `npx tsx server.ts` or `npm run dev`.
   - Initializes database singletons (`Database.getInstance()`), Express HTTP routes (`/api/auth`), WebSockets (`ws.WebSocketServer`), game state (`GameState`), and Vite dev middleware (or serves built `dist/` static assets in production).
2. **Server Internal Barrels**: `server/index.ts`, `server/multiplayer.ts`, `server/battleResolution.ts`
   - Provide clean barrel re-exports for server sub-modules.
3. **Client Runtime Entry Point**: `index.html` → `src/main.tsx` → `src/App.tsx`
   - Mounts React SPA inside `#root`.
   - `src/App.tsx` features a tab switcher connecting the gameplay canvas (`MultiplayerCanvas`) with developer tools (`TileAtlasViewer`, `ChunkInspector`, `BiomeEditor`, `PipelineTool`).
4. **Asset Pipeline Entry Point**: `assets-pipeline/run-pipeline.ts`
   - Executed via `npm run pipeline`. Runs binary GBA tileset decoding (`tilesetDecode.py`) and fetches/parses raw GBA gameplay data (`gameplayData.ts`).

---

### Architectural Boundaries
- **`src/`**: React client application shell (`main.tsx`, `App.tsx`, `index.css`).
- **`client/`**: Rendering engine (`rendering/worldCanvas.ts`) and React UI components (`ui/*`).
- **`server/`**: Multi-player network state, save management, tile movement validation, AI state machines, and battle resolution engine.
- **`shared/`**: Shared type definitions, Pokemon species/move/item databases, packets protocol, and battle formula calculators.
- **`worldgen/`**: Procedural terrain generation, biome definitions, noise algorithms, tile library indexing, and chunk generation.
- **`assets-pipeline/`**: Off-line data extraction, tile decoding, and asset compilation scripts.

---

### System Status Matrix

| Subsystem | Status | Description |
| :--- | :--- | :--- |
| **Server & WS Server** | **Working** | Dual Express + WebSocket server mounted on port 3000 with connection lifecycle management. |
| **Procedural Worldgen** | **Working** | Noise-driven elevation/moisture/temperature biomes, rivers, routes, and chunk generator (`chunkGenerator.ts`). |
| **World Canvas Renderer** | **Working** | Crisp pixel-art 2D canvas tile renderer with automatic atlas preloading and camera relative rendering (`worldCanvas.ts`). |
| **Movement Validation** | **Working** | Server-authoritative movement verification, speed caps, input sequence validation, and collision checking. |
| **Battle Resolution Engine** | **Working** | Server-side turn execution, damage/accuracy formulas, status/ability/item pipelines, and capture mechanics. |
| **Save / Load System** | **Working** | File-system JSON save state persistence under `data/saves/{playerId}.json`. |
| **Client WS Networking** | **Broken / Missing** | `MultiplayerCanvas.tsx` runs standalone local camera movement; no WebSocket connection is established to sync remote players. |
| **Overworld Entity Visuals** | **Missing** | `WorldCanvas` renders map terrain tiles, but does not yet draw player avatars or wild Pokémon overworld sprites. |
| **Client Battle UI Wiring** | **Broken / Missing** | `BattleInterface.tsx` exists as a pure UI component but is not wired to server battle events or encounter triggers. |

---

### Duplicate Systems & Type Divergence
1. **Item Category Enums vs. Strings**:
   - `LegacyItemCategory` enum used in battle engine (`CaptureDevice`, etc.).
   - `ItemData.category` union type (`"pokeball" | "medicine" | "berry" | ...`).
2. **Monster Instance Representations**:
   - `MonsterInstance` (used in battle formulas & legacy models with `maxHp`, `experienceToNext`).
   - `PokemonInstance` (used in client data structures and save manager).
3. **Terrain Tile Identifiers**:
   - Numeric tile IDs (0–15) in `legacyProceduralWorldgen.ts`.
   - String tile definition IDs (`"grass_flat_01"`, `"water_open"`) in `tileLibrary.ts` and `shared/types.ts`.

---

### Circular Dependency & Coupling Risks
1. **Worldgen ↔ Shared Barrel Coupling**: `shared/pokemonData.ts` re-exports helper functions from `worldgen/generator/legacyProceduralWorldgen.ts` (`findSafeSpawn`, `getBiomeAt`, etc.), while `chunkGenerator.ts` imports constants back from `shared/pokemonData.ts`.
2. **Server GameState ↔ Battle Integration Coupling**: `GameState` instantiates `BattleAdapter`, while `BattleAdapter` maintains a direct reference to `GameState` and calls `broadcastToMap`.
3. **AI Behaviors ↔ Worldgen Direct Dependencies**: `RoamBehavior.ts` directly imports `TILE_WATER` from `legacyProceduralWorldgen.ts`.

---

### Taxonomy of Files

#### Engine Code (Core Reusable Systems)
- `worldgen/biomes/*`
- `worldgen/generator/*`
- `worldgen/tiles/*`
- `client/rendering/worldCanvas.ts`
- `shared/battleFormulas/*`
- `server/battleResolution/*`

#### Game Code (Domain Logic & UI)
- `client/ui/BattleInterface.tsx`
- `client/ui/MultiplayerCanvas.tsx`
- `server/multiplayer/*`
- `shared/pokemonData/*`
- `src/App.tsx`

#### Tool Code (Offline Pipeline & Dev Inspection)
- `assets-pipeline/*`
- `client/ui/TileAtlasViewer.tsx`
- `client/ui/ChunkInspector.tsx`
- `client/ui/BiomeEditor.tsx`
- `client/ui/PipelineTool.tsx`

---

## 2. Migration Risks

1. **Module Import Resolution breaking under ESM**:
   - TypeScript imports explicitly use `.js` extension (e.g. `import { GameState } from './game.js'`). Care must be taken during refactoring to maintain valid Node ESM resolution without breaking Vite bundler output.
2. **State Desynchronization during Movement Refactoring**:
   - Server-side tick & input validation (`handlePlayerInput`) relies on strict sequence numbers and tile collision checks. Client socket integration must match packet timing to prevent rubberbanding.
3. **Loose Type Casting (`any`) Risks**:
   - Past quick-fixes introduced `as any` casts around `StatusEffect` and `MonsterInstance` / `PokemonInstance` property mappings. Unifying these types carefully is essential for long-term type safety.

---

## 3. Recommended Migration Order

1. **Phase 1: Architecture & Domain Boundary Clean-up**
   - Decouple `worldgen` exports from `shared/pokemonData.ts`.
   - Unify `MonsterInstance` and `PokemonInstance` models into a single canonical interface across client and server.
2. **Phase 2: Client WebSocket Networking Layer**
   - Implement a robust `NetworkClient` / `useMultiplayerSocket` hook in the React frontend.
   - Wire `Hello`, `Welcome`, `PlayerJoin`, `PlayerMove`, `PlayerPos`, and `PlayerLeave` packet handlers.
3. **Phase 3: Overworld Entity & Remote Player Rendering**
   - Extend `WorldCanvas` to draw player character sprites, direction indicators, usernames, and server-controlled wild Pokémon entities on top of terrain layers.
4. **Phase 4: Battle System UI Integration**
   - Connect overworld tall grass/water step triggers (`EncounterIntegration`) to server `BattleAdapter`.
   - Wire live battle state updates from `BattleSessionManager` directly into `BattleInterface.tsx`.
5. **Phase 5: Worldgen & Spawner Alignment**
   - Align `PokemonSpawnManager` with `chunkGenerator.ts` output and biome spawn tables rather than legacy map tile assumptions.
6. **Phase 6: Save System Polish & Dev Tools Isolation**
   - Auto-save player state on battles and disconnects.
   - Isolate developer tools (`TileAtlasViewer`, `BiomeEditor`, etc.) into dedicated dev routes or conditional flags.
