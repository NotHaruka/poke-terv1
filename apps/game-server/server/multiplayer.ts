/**
 * server/multiplayer.ts
 *
 * Single entry point for everything networking/multiplayer-related, lifted from the old
 * poke-ter project. This ended up pulling in more than just "trading and battle sessions" —
 * the dependency chain from the WebSocket handlers reached into game session state, the save
 * system, wild Pokémon AI, and battle/encounter integration. All of it is genuinely part of
 * "what makes multiplayer work," so it's grouped here rather than split arbitrarily.
 *
 * server/multiplayer/
 *   handlers.ts               - WebSocket message handlers (the actual networking entry point)
 *   game.ts                   - GameState: per-session world/player state
 *   SaveManager.ts            - player data persistence
 *   BattleSessionManager.ts, TradeEvents.ts, TradeManager.ts, TradeSession.ts,
 *   TradeValidator.ts         - PvP battle sessions + trading
 *   PokemonSpawnManager.ts    - wild Pokémon spawning (NOTE: this used the old fixed-map spawn
 *                               logic; you'll likely want to rewire this against
 *                               worldgen/generator/chunkGenerator.ts's output instead of the
 *                               legacy map assumptions baked in here)
 *   ai/                       - wild Pokémon behavior state machine (Idle/Roam/Flee/Aggro/etc.)
 *   integration/              - BattleAdapter, EncounterIntegration, GameplayEvents,
 *                               GameplayValidator (glue between battle, encounters, and game state)
 *   types.ts                  - ClientState, MapInstance
 *
 * One cross-package dependency worth knowing about: ai/Behaviors/RoamBehavior.ts imports
 * TILE_WATER from worldgen/generator/legacyProceduralWorldgen.ts (server depends on worldgen
 * for one constant) — not from pokemonData, since tile IDs are a worldgen concept now.
 */

export * from './multiplayer/handlers.js';
export * from './multiplayer/game.js';
export * from './multiplayer/SaveManager.js';
export * from './multiplayer/BattleSessionManager.js';
export * from './multiplayer/TradeEvents.js';
export * from './multiplayer/TradeManager.js';
export * from './multiplayer/TradeSession.js';
export * from './multiplayer/TradeValidator.js';
export * from './multiplayer/PokemonSpawnManager.js';
export * from './multiplayer/types.js';

// --- ai/ ---
export * from './multiplayer/ai/BehaviorContext.js';
export * from './multiplayer/ai/BehaviorController.js';
export * from './multiplayer/ai/BehaviorState.js';
export * from './multiplayer/ai/Behaviors/AggroBehavior.js';
export * from './multiplayer/ai/Behaviors/DespawnBehavior.js';
export * from './multiplayer/ai/Behaviors/FleeBehavior.js';
export * from './multiplayer/ai/Behaviors/FollowBehavior.js';
export * from './multiplayer/ai/Behaviors/IdleBehavior.js';
export * from './multiplayer/ai/Behaviors/InvestigateBehavior.js';
export * from './multiplayer/ai/Behaviors/ReturnHomeBehavior.js';
export * from './multiplayer/ai/Behaviors/RoamBehavior.js';
export * from './multiplayer/ai/Behaviors/SleepBehavior.js';

// --- integration/ ---
export * from './multiplayer/integration/BattleAdapter.js';
export * from './multiplayer/integration/EncounterIntegration.js';
export * from './multiplayer/integration/GameplayEvents.js';
export * from './multiplayer/integration/GameplayValidator.js';
