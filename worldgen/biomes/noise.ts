/**
 * worldgen/biomes/noise.ts
 *
 * The actual noise primitives (hash2D, value noise, fbm) live inside
 * generator/legacyProceduralWorldgen.ts (lifted from the old poke-ter project's
 * shared/src/worldgen.ts — it was already a real, working deterministic noise system, not
 * something worth rebuilding). Only hash2D is exported there; this file re-exports it plus the
 * generator classes that use noise internally, so biome code can depend on `./noise` without
 * reaching into the generator folder.
 */
export { hash2D, HeightGenerator, MoistureGenerator, TemperatureGenerator } from '../generator/legacyProceduralWorldgen.js';
