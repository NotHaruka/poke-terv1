# poke-ter System Architecture

This document outlines the software architecture of the **poke-ter** full-stack procedural Pokémon-inspired RPG sandbox application.

---

## 1. High-Level Directory Overview

The project is structured as a modular full-stack monorepo featuring separated concerns between runtime environments:

*   **`apps/game-client/`**: React 18, Vite-powered single-page client.
    *   `/src/App.tsx`: Main app layout and sandbox tab routing.
    *   `/ui/MultiplayerCanvas.tsx`: Monolithic overworld game engine, loop rendering, user interaction, battle system orchestration, local party/bag overlays, and client-side state persistence.
    *   `/ui/BattleInterface.tsx`: Pure battle scene visual presentation module.
*   **`apps/game-server/`**: Custom Express HTTP + WebSocket (ws) server running on Port 3000.
    *   `/server.ts`: Multiplexes API authentication routes (`/api/auth`) and active player synchronization socket connections.
    *   `/server/multiplayer/`: Handles remote player joining, packet routing, tick-based authoritative validation, and movement speed checking.
*   **`packages/game-core/`**: Shared registry definitions, item indices, species definitions, move catalogs, and singletons.
    *   `/pokemonData/managers/PokemonManager.ts`: Central database tracker for party configurations and PC storage slots.
*   **`packages/worldgen/`**: Elevation-based 2D noise procedural generation engines and chunk generators.
*   **`tools/world-editor/`**: Specialized development interfaces (`TileAtlasViewer`, `ChunkInspector`, `BiomeEditor`, `PipelineTool`) used by authors to debug mechanics.

---

## 2. Core Control Flows & Lifecycles

### A. Main Gameplay Loop & Rendering
The client game loop resides in `MultiplayerCanvas.tsx` and executes under a continuous `requestAnimationFrame` lifecycle:
1.  **Input Collection**: Keydown listeners record directional and execution inputs.
2.  **State Update**: Suspended when dialogue pages or battle stages are active. Movement handles step counting, checking biome tags for encounters, and transition triggers.
3.  **Camera & Draw Phase**: Translates coordinates based on player target alignment, renders map layers using `WorldCanvas`, and overlays animated entities.

### B. Encounter & Battle Flow
1.  **Step Count Trigger**: Walking in Tall Grass checks a configurable probability rule. On success, a cooldown is applied to prevent consecutive encounters.
2.  **Wild Pokémon Generation**: Instantiates a species entry via the `PokemonFactory` scaled between min-max biome levels, selecting suitable level-based moves.
3.  **Battle Stage Transition**: Overworld controls freeze, battle music/visual elements mount, and control shifts to a stateful round executor checking status effects, speed tiers, damage formulas, and item usage.

### C. Developer Tool Isolation
Developer tools are isolated from production builds. In `App.tsx`, active navigation tabs filter out editor options unless Vite runs in local development mode or the client URL contains a specific dev search parameter (`?dev=true`).
