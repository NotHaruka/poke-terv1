/**
 * server/battleResolution.ts
 *
 * Single entry point for server-side battle resolution, lifted from the old poke-ter project's
 * server/src/game/pokemon/battle/ and server/src/game/pokemon/capture/. Same safe pattern as
 * shared/pokemonData.ts and shared/battleFormulas.ts: original files preserved under
 * server/battleResolution/, imports rewritten to the new locations, this file re-exports all of it.
 *
 * server/battleResolution/
 *   BattleAction.ts, BattleActionQueue.ts, BattleContext.ts, BattleEvents.ts, BattleInstance.ts,
 *   BattleManager.ts, BattleParticipant.ts, BattleState.ts   - core battle runtime
 *   effects/    - AbilityPipeline, ItemPipeline, StatusPipeline
 *   providers/  - ActionProvider + Human/Network/RaidBoss/TrainerAI/WildAI implementations
 *   capture/    - CaptureCalculator, CaptureContext, CaptureEvents, CaptureManager, CaptureValidator
 *
 * NOTE: BattleState here is the REAL implementation (30 lines, actual phase logic) — not to be
 * confused with the empty stub that used to live in shared/src/pokemon/models/BattleState.ts,
 * which was dropped during the rebuild (see shared/battleFormulas.ts for the note on that).
 */

// --- core battle runtime ---
export * from './battleResolution/BattleAction.js';
export * from './battleResolution/BattleActionQueue.js';
export * from './battleResolution/BattleContext.js';
export * from './battleResolution/BattleEvents.js';
export * from './battleResolution/BattleInstance.js';
export * from './battleResolution/BattleManager.js';
export * from './battleResolution/BattleParticipant.js';
export * from './battleResolution/BattleState.js';

// --- effects/ ---
export * from './battleResolution/effects/AbilityPipeline.js';
export * from './battleResolution/effects/ItemPipeline.js';
export * from './battleResolution/effects/StatusPipeline.js';

// --- providers/ ---
export * from './battleResolution/providers/ActionProvider.js';
export * from './battleResolution/providers/HumanActionProvider.js';
export * from './battleResolution/providers/NetworkActionProvider.js';
export * from './battleResolution/providers/RaidBossActionProvider.js';
export * from './battleResolution/providers/TrainerAIActionProvider.js';
export * from './battleResolution/providers/WildAIActionProvider.js';

// --- capture/ ---
export * from './battleResolution/capture/CaptureCalculator.js';
export * from './battleResolution/capture/CaptureContext.js';
export * from './battleResolution/capture/CaptureEvents.js';
export * from './battleResolution/capture/CaptureManager.js';
export * from './battleResolution/capture/CaptureValidator.js';
