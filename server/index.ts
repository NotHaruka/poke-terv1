/**
 * server/index.ts
 *
 * Barrel re-exporting the three server modules. The actual runnable HTTP/WebSocket server
 * entry point is the root-level server.ts (run via `npx tsx server.ts` or the `dev`/`start`
 * npm scripts) — this file is just for convenient single-import access to server internals
 * from elsewhere (tests, tooling, etc.), same pattern as shared/pokemonData.ts.
 */
export * from './auth.js';
export * from './battleResolution.js';
export * from './multiplayer.js';
