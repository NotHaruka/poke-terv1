/**
 * shared/battleFormulas.ts
 *
 * Single entry point for battle math lifted from the old poke-ter project:
 * stat/EXP/nature/IV systems (shared/src/pokemon/systems/) and the actual damage/accuracy/
 * crit/speed/type-effectiveness calculators (server/src/game/pokemon/battle/calculators/).
 *
 * Same approach as pokemonData.ts: original files preserved under shared/battleFormulas/,
 * imports rewritten to point at the new pokemonData location, this file just re-exports
 * everything from one place.
 *
 * shared/battleFormulas/
 *   systems/      - EVSystem, ExperienceCalculator, FriendshipSystem, IVGenerator,
 *                   NatureSystem, StatCalculator
 *   calculators/  - AccuracyCalculator, CriticalHitCalculator, DamageCalculator,
 *                   SpeedCalculator, TypeEffectivenessCalculator
 *   models/       - BattleState (moved here from pokemonData since it's battle-specific,
 *                   not core species/move/item data)
 */

// --- systems/ ---
export * from './battleFormulas/systems/EVSystem.js';
export * from './battleFormulas/systems/ExperienceCalculator.js';
export * from './battleFormulas/systems/FriendshipSystem.js';
export * from './battleFormulas/systems/IVGenerator.js';
export * from './battleFormulas/systems/NatureSystem.js';
export * from './battleFormulas/systems/StatCalculator.js';

// --- calculators/ ---
export * from './battleFormulas/calculators/AccuracyCalculator.js';
export * from './battleFormulas/calculators/CriticalHitCalculator.js';
export * from './battleFormulas/calculators/DamageCalculator.js';
export * from './battleFormulas/calculators/SpeedCalculator.js';
export * from './battleFormulas/calculators/TypeEffectivenessCalculator.js';

// NOTE: BattleState is NOT exported here. shared/src/pokemon/models/BattleState.ts in the old
// project was an empty stub (`export class BattleState {}`) — the real 30-line implementation
// lives in server/src/game/pokemon/battle/BattleState.ts, which was moved to
// server/battleResolution/BattleState.ts and is re-exported from server/battleResolution.ts
// instead. Importing BattleState from here would have silently pulled in the dead stub.
